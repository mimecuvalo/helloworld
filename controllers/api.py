import datetime
import hashlib
import re
import urllib
import urllib2
import urlparse

from base import BaseHandler
from logic import content_remote
from logic import pubsubhubbub_subscribe
from logic import socialize
from logic import spam
from logic import url_factory
from logic import users

from BeautifulSoup import BeautifulSoup
import tornado.web

class ApiHandler(BaseHandler):
  def get(self):
    if not self.authenticate(author=True):
      return

    op = self.get_argument('op')
    if op == 'follow':
      self.follow()

    self.set_status(204)

  def post(self):
    op = self.get_argument('op')

    if op == 'comment':
      if not self.current_user:
        raise tornado.web.HTTPError(400)
      self.comment()
      self.set_status(204)
      return

    if not self.authenticate(author=True):
      return

    if op == 'embed':
      self.embed()
      return
    elif op == 'order':
      self.order()
    elif op == 'rename':
      self.rename()
    elif op == 'follow':
      self.follow()
    elif op == 'unfollow':
      self.unfollow()
    elif op == 'favorite':
      self.favorite()
    elif op == 'spam':
      self.spam()
    elif op == 'delete':
      self.delete()

    self.set_status(204)

  def embed(self):
    # TODO, same code in upload.py - code be unified...

    try:
      url = self.get_argument('url')
      remote_title, remote_thumb, remote_html = content_remote.get_remote_title_and_thumb(url, 'text/html')
      if remote_html:
        self.write(remote_html)
        return

      if remote_thumb:
        self.write('<a href="' + url + '" title="' + remote_title + '"><img src="' + remote_thumb + '"></a>')
        return
    except:
      pass

    self.write('<a href="' + url + '">' + url + '</a>')

  def order(self):
    op_type = self.get_argument('type')
    dragged = self.get_argument('dragged')
    dropped = self.get_argument('dropped')
    section_album = self.get_argument('current_section_album')
    position = int(self.get_argument('position'))
    new_section = self.get_argument('new_section', '')

    profile = self.get_author_username()
    if dragged.find('hw-sitemap|') == 0:
      dragged = dragged[len('hw-sitemap|'):]
    else:
      dragged = dragged[len('hw-collection|'):]

    if op_type == 'content':
      name = dragged
      if dropped.find('hw-sitemap|') == 0:  # moving to another section/album
        section_album = dropped.split('|')
        content = self.models.content.get(username=profile, name=name)[0]
        content.section = section_album[1]
        if len(section_album) == 3:
          content.album = section_album[2]
        else:
          content.album = ''
        content.save()
        return
      else:
        section_album = section_album.split('|')
        collection, common_options = self.get_collection(profile=profile, section=section_album[0], name=section_album[1])[:]
    elif op_type == 'section':
      name = dragged
      collection = self.get_main_sections(profile=profile)
    else:
      section_album = dragged.split('|')
      name = section_album[1]

      if not new_section:
        collection = self.get_albums(profile=profile, section=section_album[0])
      else:
        album_items = self.models.content.get(username=profile,
                                              album=name)[:]
        for item in album_items:
          item.section = new_section
          item.save()

        album_item = self.models.content.get(username=profile,
                                             name=name)[0]
        album_item.section = new_section
        album_item.save()

        collection = self.get_albums(profile=profile, section=new_section)

    counter = 0
    inserted = False
    for item in collection:
      if counter == position:
        counter += 1
      item.order = counter
      if item.name == name:
        item.order = position
        inserted = True
        counter -= 1
      item.save()
      counter += 1

  def rename(self):
    op_type = self.get_argument('type')
    old_id = self.get_argument('id')
    new_title = self.get_argument('new')
    new_name = new_title

    old_name = old_id[11:]  # remove hw-sitemap|

    if op_type == 'section':
      self.rename_section(old_name, new_name, new_title)
    else:
      self.rename_album(section_album[0], section_album[1], new_name, new_title)

  def follow(self):
    user_url = self.get_argument('user').strip()
    profile = self.get_author_username()
    user = users.get_remote_user_info(self, user_url, profile)
    user.following = 1
    user.save()

    if user.salmon_url:
      users.salmon_follow(self, user.salmon_url)

    # get some content, yo
    feed_response = urllib2.urlopen(user.feed_url)
    content_remote.parse_feed(self.models, user, feed_response.read())

  def unfollow(self):
    user_url = self.get_argument('user')
    profile = self.get_author_username()

    content_remote = self.models.content_remote.get(to_username=profile, from_user=user_url)[:]
    for content in content_remote:
      content.delete()

    user_remote = self.models.users_remote.get(local_username=profile, profile_url=user_url)[0]

    if user_remote.hub_url:
      try:
        callback_url = self.nav_url(host=True, username=profile, section='push')
        pubsubhubbub_subscribe.subscribe_topic(user_remote.hub_url, user_remote.feed_url, callback_url, subscribe=False, verify="sync")
      except:
        import logging
        logging.error("couldn't unsubscribe from hub!")

    if not user_remote.follower:
      user_remote.delete()
    else:
      user_remote.following = 0
      user_remote.save()

  def check_ownership(self, content, is_remote):
    if is_remote and not self.constants['single_user_site'] and content.to_username != self.current_user["username"]:
      raise tornado.web.HTTPError(400, "i call shenanigans")
    if not is_remote:
      local_url = content.thread.split(':')[2]
      original_url = url_factory.load_basic_parameters(self, url=local_url)
      original_content = self.models.content.get(username=original_url['profile'], name=original_url['name'])[0]
      if not self.constants['single_user_site'] and original_content.username != self.current_user["username"]:
        raise tornado.web.HTTPError(400, "i call shenanigans")

  def favorite(self):
    profile = self.get_author_username()

    local_id = self.get_argument('local_id')
    is_remote = int(self.get_argument('is_remote'))
    content = self.models.content_remote.get(local_id) if is_remote else self.models.content.get(local_id)
    if not content:
      raise tornado.web.HTTPError(400)

    self.check_ownership(content, is_remote)

    not_favorited = self.get_argument('not_favorited')
    favorited = not int(not_favorited)
    content.favorited += 1 if favorited else -1
    content.save()

    if is_remote:
      user = self.get_argument('user', '')
      if user:
        user_remote = self.models.users_remote.get(local_username=profile, profile_url=user)[0]
        if not user_remote:
          return

      post_id = self.get_argument('post_id', '')
      if post_id and user and user_remote.salmon_url:
        users.salmon_favorite(self, user_remote.salmon_url, post_id, favorite=(favorited == 1))

  def spam(self):
    local_id = self.get_argument('local_id')
    not_spam = self.get_argument('not_spam')
    is_remote = int(self.get_argument('is_remote'))

    content = self.models.content_remote.get(local_id) if is_remote else self.models.content.get(local_id)
    if not content:
      raise tornado.web.HTTPError(400)

    profile = self.get_author_user()
    self.check_ownership(content, is_remote)

    content.is_spam = not int(not_spam)
    content.save()

    if not_spam:
      spam.train_ham(content.view, self.application.settings["private_path"], profile.username)
    else:
      spam.train_spam(content.view, self.application.settings["private_path"], profile.username)

  def delete(self):
    local_id = self.get_argument('local_id')
    not_deleted = self.get_argument('not_deleted')
    is_remote = int(self.get_argument('is_remote'))

    content = self.models.content_remote.get(local_id) if is_remote else self.models.content.get(local_id)
    if not content:
      raise tornado.web.HTTPError(400)

    self.check_ownership(content, is_remote)

    content.deleted = not int(not_deleted)
    content.save()

  def comment(self):
    if self.current_user["user"]:
      # local user
      profile = self.get_author_user()
      commented_content = self.models.content.get(self.get_argument('local_id'))
      comment = self.get_argument('comment')

      is_spam = spam.guess(comment, self.application.settings["private_path"], profile.username)

      content = self.models.content()
      content.username = profile.username
      content.section  = 'comments'
      content.name     = self.get_unique_name(content, title='comment')
      content.date_created = datetime.datetime.utcnow()
      content.date_updated = datetime.datetime.utcnow()
      if is_spam:
        content.is_spam = True
      else:
        spam.train_ham(comment, self.application.settings["private_path"], profile.username)
      content.avatar = profile.logo
      content.title = 'comment'
      thread_url = 'tag:' + self.request.host + ',' + self.display["tag_date"] + ':' + self.content_url(commented_content)
      content.thread = thread_url
      content.thread_user = self.get_argument('thread_user', None)
      content.view = content_remote.sanitize(comment)
      content.save()

      commented_content.comments += 1
      commented_content.save()

      thread = self.get_argument('thread', None)
      if thread:
        socialize.reply(self, content, thread=thread)
    else:
      # remote user
      commented_content = self.models.content.get(self.get_argument('local_id'))
      comment = self.get_argument('comment')

      is_spam = spam.guess(comment, self.application.settings["private_path"], commented_content.username)

      post_remote = self.models.content_remote()
      post_remote.to_username = commented_content.username
      post_remote.from_user = self.current_user["email"]
      post_remote.username = self.current_user["email"].split('@')[0]
      post_remote.avatar = 'http://www.gravatar.com/avatar/' + hashlib.md5(self.current_user["email"].lower()).hexdigest()
      post_remote.date_created = datetime.datetime.utcnow()
      if is_spam:
        post_remote.is_spam = True
      else:
        spam.train_ham(comment, self.application.settings["private_path"], commented_content.username)
      post_remote.type = 'comment'
      post_remote.local_content_name = commented_content.name
      post_remote.view = content_remote.sanitize(comment)
      post_remote.save()

      commented_content.comments += 1
      commented_content.save()
