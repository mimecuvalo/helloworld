import datetime
import hashlib
import json
import os.path
import re
import urllib
import urllib2
import urlparse
import uuid

from base import BaseHandler
from logic import cache
from logic import content as content_logic
from logic import content_remote
from logic import media
from logic import pubsubhubbub_subscribe
from logic import smtp
from logic import socialize
from logic import spam
from logic import url_factory
from logic import users

import tornado.web

class ApiHandler(BaseHandler):
  def get(self):
    if not self.authenticate(author=True):
      return

    op = self.get_argument('op')
    if op == 'follow':
      self.follow()

    if self.get_argument('from_email', ''):
      self.redirect(self.nav_url(section='dashboard'))
    else:
      self.set_status(204)

  def post(self):
    op = self.get_argument('op')

    if op == 'comment':
      if not self.current_user:
        raise tornado.web.HTTPError(400)
      self.comment()
      self.set_status(204)
      return

    if op == 'topic':
      if not self.current_user:
        raise tornado.web.HTTPError(400)
      self.topic()
      self.set_status(201)
      return

    if not self.authenticate(author=True):
      return

    if op == 'embed':
      self.embed()
      return
    elif op == 'read':
      self.read(read=True)
    elif op == 'unread':
      self.read(read=False)
    elif op == 'read_all':
      self.read_all()
    elif op == 'order':
      self.order()
    elif op == 'order_following':
      self.order_following()
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
    try:
      url = self.get_argument('url')
      media_type = media.detect_media_type(url)

      if media_type in ('video', 'image', 'audio', 'web'):
        parent_url = url_factory.resource_url(self, 'remote')
        parent_directory = url_factory.resource_directory(self, 'remote')
        leafname = os.path.basename(url)
        full_path = os.path.join(parent_directory, leafname)
        url_factory.check_legit_filename(full_path)

        if not os.path.isdir(parent_directory):
          os.makedirs(parent_directory)

        response = urllib2.urlopen(url)
        original_size_url, url, thumb_url = media.save_locally(parent_url, full_path, response.read())

        if thumb_url:
          self.set_header('X-Helloworld-Thumbnail', thumb_url)

        self.write(media.generate_full_html(self, url, original_size_url))
        return

      remote_title, remote_thumb, remote_html = content_remote.get_remote_title_and_thumb(url, 'text/html')

      if remote_title:
        self.set_header('X-Helloworld-Title', remote_title)

      if remote_thumb:
        self.set_header('X-Helloworld-Thumbnail', remote_thumb)

      if remote_html:
        self.write(remote_html)
        return

      if remote_thumb:
        self.write('<a href="' + url + '" title="' + remote_title + '"><img src="' + remote_thumb + '"></a>')
        return
    except:
      pass

    self.write('<a href="' + url + '">' + url + '</a>')

  def read(self, read=True):
    ids = json.loads(self.get_argument('ids'))

    for item in ids:
      remote_item = self.models.content_remote.get(int(item))

      if not self.constants['single_user_site'] and remote_item.to_username != self.current_user["username"]:
        raise tornado.web.HTTPError(400, "i call shenanigans")

      remote_item.read = read
      remote_item.save()

  def read_all(self):
    user = self.get_argument('user')
    profile = self.get_author_username()
    if user in self.constants['external_sources']:
      content = self.models.content_remote.get(to_username=profile, type=user)[:]
    else:
      content = self.models.content_remote.get(to_username=profile, from_user=user)[:]

    for item in content:
      item.read = True
      item.save()

  def order(self):
    op_type = self.get_argument('type')
    dragged = self.get_argument('dragged')
    dropped = self.get_argument('dropped')
    section_album = self.get_argument('current_section_album')
    position = int(self.get_argument('position'))
    new_section = self.get_argument('new_section', '')

    profile = self.get_author_username()
    if dragged.find('hw-sitemap_') == 0:
      dragged = dragged[len('hw-sitemap_'):]
    else:
      dragged = dragged[len('hw-collection_'):]

    if op_type == 'content':
      name = dragged
      if dropped.find('hw-sitemap_') == 0:  # moving to another section/album
        section_album = dropped.split('_')
        content = self.models.content.get(username=profile, name=name)[0]
        content.section = section_album[1]
        if len(section_album) == 3:
          content.album = section_album[2]
        else:
          content.album = ''
        content.save()
        return
      else:
        section_album = section_album.split('_')
        collection, common_options = content_logic.get_collection(self, profile=profile, section=section_album[0], name=section_album[1])[:]
    elif op_type == 'section':
      name = dragged
      collection = content_logic.get_main_sections(self, profile=profile)
    else:
      section_album = dragged.split('_')
      name = section_album[1]

      if not new_section:
        collection = content_logic.get_albums(self, profile=profile, section=section_album[0])
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

        collection = content_logic.get_albums(self, profile=profile, section=new_section)

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

  def order_following(self):
    dragged = self.get_argument('dragged')
    position = int(self.get_argument('position'))

    profile = self.get_author_username()
    following = self.models.users_remote.get(local_username=profile, following=1).order_by('order,username')[:]
    dragged_id = int(dragged[len('hw-following-'):])

    # TODO consolidate with above function?
    counter = 0
    inserted = False
    for item in following:
      if counter == position:
        counter += 1
      item.order = counter
      if item.id == dragged_id:
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

    old_name = old_id[11:]  # remove hw-sitemap_

    if op_type == 'section':
      content_logic.rename_section(self, old_name, new_name, new_title)
    else:
      content_logic.rename_album(self, section_album[0], section_album[1], new_name, new_title)

  def follow(self):
    user_url = self.get_argument('user_url').strip()
    if not user_url.startswith('http://'):
      user_url = 'http://' + user_url
    profile = self.get_author_username()
    user = users.get_remote_user_info(self, user_url, profile)

    # don't subscribe to yourself
    if user.profile_url == self.nav_url(host=True, username=profile):
      return

    user.following = 1
    user.save()

    if user.salmon_url:
      users.salmon_follow(self, user.salmon_url)

    # get some content, yo
    feed_response = urllib2.urlopen(user.feed_url)
    content_remote.parse_feed(self.models, user, feed_response.read(), max_days_old=self.constants['feed_max_days_old'])

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
    if is_remote:
      content.favorited = 1 if favorited else 0
    else:
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
    commented_content = self.models.content.get(username=self.get_argument('local_user'), name=self.get_argument('local_name'))[0]
    self.display["user"] = commented_user = self.models.users.get(username=commented_content.username)[0]
    comment = self.get_argument('comment')
    sanitized_comment = content_remote.sanitize(comment)

    is_spam = spam.guess(comment, self.application.settings["private_path"], commented_content.username)

    post_remote = self.models.content_remote()
    post_remote.to_username = commented_content.username
    post_remote.from_user = self.current_user["email"]
    post_remote.username = self.current_user["email"].split('@')[0]
    local_url = '/' + commented_content.username + '/remote-comments/comment-' + str(uuid.uuid4())
    post_remote.post_id = 'tag:' + self.request.host + ',' + self.display["tag_date"] + ':' + local_url
    post_remote.link = 'http://' + self.request.host + local_url
    from_username = post_remote.username
    if self.current_user["user"]:
      profile = self.get_author_user()
      post_remote.avatar = profile.logo if profile.logo else profile.favicon
    else:
      post_remote.avatar = 'http://www.gravatar.com/avatar/' + hashlib.md5(self.current_user["email"].lower()).hexdigest()
    post_remote.date_created = datetime.datetime.utcnow()
    if is_spam:
      post_remote.is_spam = True
    else:
      spam.train_ham(comment, self.application.settings["private_path"], commented_content.username)
    post_remote.type = 'comment'
    post_remote.local_content_name = commented_content.name
    post_remote.view = sanitized_comment
    post_remote.save()

    commented_content.comments_count += 1
    commented_content.comments_updated = datetime.datetime.utcnow()
    commented_content.save()

    cache.remove(self, self.content_url(commented_content))
    socialize.socialize(self, commented_content)
    smtp.comment(self, from_username, post_remote.from_user, commented_user.email, self.content_url(commented_content, host=True), sanitized_comment)

  def topic(self):
    username = self.get_argument('username')
    section = self.get_argument('section')
    album = self.get_argument('album', '')
    topic = self.get_argument('topic')

    section_item = self.models.content.get(username=username,
                                           section='main',
                                           name=section)[0]
    template = section_item.template

    if not template and album:
      album_item = self.models.content.get(username=username,
                                           section=section,
                                           album='main',
                                           name=album)[0]
      template = album_item.template

    if template != 'forum':
      raise tornado.web.HTTPError(400, "i call shenanigans")

    content              = self.models.content()
    content.username     = username
    content.section      = section
    content.album        = album
    content.title        = topic
    content.name         = content_logic.get_unique_name(self, content, "_", topic)
    content.forum        = True
    current_datetime     = datetime.datetime.utcnow()
    content.date_created = current_datetime
    content.date_updated = current_datetime
    content.save()

    self.set_header('Location', self.content_url(content))
