import datetime
import re
import urllib2
import urlparse

from BeautifulSoup import BeautifulSoup
import magicsig
import salmoning
import tornado.escape
import tornado.web

from base import BaseHandler
from logic import content_remote
from logic import smtp
from logic import socialize
from logic import spam
from logic import url_factory
from logic import users

class SalmonHandler(BaseHandler):
  class MockKeyRetriever(magicsig.KeyRetriever):
    def __init__(self, handler, local_user):
      self.handler = handler
      self.local_user = local_user
      self.signer_uri = None

    def LookupPublicKey(self, signer_uri=None):
      self.signer_uri = signer_uri
      user_remote = self.handler.models.users_remote.get(
          local_username=self.local_user.username, profile_url=signer_uri)[0]

      if not user_remote:
        # get host-meta first
        lrdd_link = users.get_lrdd_link(signer_uri)

        if not lrdd_link:
          raise tornado.web.HTTPError(400)

        # get webfinger
        webfinger_doc = users.get_webfinger(lrdd_link, signer_uri)
        magic_key = webfinger_doc.find('link',
            rel='magic-public-key')['href'].replace(
            'data:application/magic-public-key,', '')

        if not magic_key:
          raise tornado.web.HTTPError(400)

        new_user = self.handler.models.users_remote()
        new_user.local_username = self.local_user.username
        new_user.profile_url = signer_uri
        new_user.magic_key = magic_key
        new_user.save()

        return (str(magic_key))
      else:
        return (str(user_remote.magic_key))

  def post(self):
    acct = self.get_argument("q").split(':')

    # remove acct: if it's there
    if len(acct) > 1:
      acct[0] = acct[1].split('@')[0]

    acct = acct[0].split('@')[0]

    self.display["acct"] = acct
    user = self.models.users.get(username=acct)[0]

    if not user:
      raise tornado.web.HTTPError(404)

    self.display["user"] = user

    salmonizer = salmoning.SalmonProtocol()
    salmonizer.key_retriever = self.MockKeyRetriever(handler=self,
        local_user=user)
    env = salmonizer.ParseSalmon(self.request.body,
        'application/magic-envelope+xml')
    self.handle_activity_verb(env, salmonizer.key_retriever.signer_uri)

  # tornado & python rock
  def check_xsrf_cookie(self):
    pass


  def handle_activity_verb(self, env, signer_uri):
    salmon_doc = BeautifulSoup(env)
    activity_verb = salmon_doc.find(re.compile('.+:verb$')).string
    user_remote = self.models.users_remote.get(
        local_username=self.display["user"].username,
        profile_url=signer_uri)[0]

    if (activity_verb == 'http://activitystrea.ms/schema/1.0/follow'):
      user = users.get_remote_user_info(self, signer_uri,
          user_remote.local_username)
      user.follower = 1
      user.save()
      smtp.follow(self, user.username, self.display["user"].email,
          user.profile_url)
    elif (activity_verb == 'http://ostatus.org/schema/1.0/unfollow' or
        activity_verb == 'http://activitystrea.ms/schema/1.0/stop-following'):
      user_remote.follower = 0
      user_remote.save()
    elif (activity_verb == 'http://activitystrea.ms/schema/1.0/favorite'):
      activity_object = salmon_doc.find(re.compile('.+:object$'))
      atom_id = activity_object.find('atom:id').string
      local_url = atom_id.split(':')[2]
      content_url = url_factory.load_basic_parameters(self, url=local_url)

      already_favorited = self.models.content_remote.get(
          to_username=self.display["user"].username,
          from_user=signer_uri,
          type='favorite',
          local_content_name=content_url['name'])[0]
      if already_favorited:
        return

      content = self.models.content.get(username=self.display["user"].username,
                                        name=content_url['name'])[0]
      if not content:
        raise tornado.web.HTTPError(400)
      content.favorites += 1
      content.save()

      favorite_record = self.models.content_remote()
      favorite_record.to_username = self.display["user"].username
      favorite_record.from_user = signer_uri
      favorite_record.username = user_remote.username
      favorite_record.date_created = datetime.datetime.strptime(
          salmon_doc.find('atom:updated').string[:-6], '%Y-%m-%dT%H:%M:%S')
      favorite_record.type = 'favorite'
      favorite_record.local_content_name = content.name
      favorite_record.save()
    elif (activity_verb == 'http://activitystrea.ms/schema/1.0/unfavorite' or
        activity_verb == 'http://ostatus.org/schema/1.0/unfavorite'):
      # TODO no activity object at least with ostatus??
      pass
    elif (activity_verb == 'http://activitystrea.ms/schema/1.0/share'):
      # TODO
      pass
    elif (activity_verb == 'http://activitystrea.ms/schema/1.0/post'):
      atom_content = salmon_doc.find('atom:content').string
      sanitized_atom_content = content_remote.sanitize(
          tornado.escape.xhtml_unescape(atom_content))

      existing_content = self.models.content_remote.get(
          to_username=self.display["user"].username,
          from_user=signer_uri,
          view=sanitized_atom_content)[0]

      thread = salmon_doc.find('thr:in-reply-to')
      ref = ''
      if thread:
        try:
          local_url = thread['ref'].split(':')[2]
          content_url = url_factory.load_basic_parameters(self, url=local_url)
          content = self.models.content.get(
              username=self.display["user"].username,
              name=content_url['name'])[0]
          if not content:
            raise tornado.web.HTTPError(400)
          ref = content_url['name']
          content.comments_count += 1
          content.comments_updated = datetime.datetime.utcnow()
          content.save()
        except Exception as ex:
          import logging
          logging.error("something wrong with thread")
          logging.error(ex)

      replies = salmon_doc.find('thr:replies')
      comments_count = 0
      comments_updated = None
      if replies:
        if replies.has_key('count'):
          comments_count = int(replies['count'])
        if replies.has_key('updated'):
          comments_updated = replies['updated']
        comments_response = urllib2.urlopen(replies['href'])
        content_remote.parse_feed(self.models, user_remote,
            comments_response.read(), remote_comments=True)

      mentioned = salmon_doc.findAll('atom:link', rel='mentioned')
      if not mentioned:
        mentioned = salmon_doc.findAll('atom:link', rel='ostatus:attention')

      this_user_mentioned = False
      if mentioned:
        this_user_url = self.nav_url(host=True,
            username=self.display["user"].username)
        for mentions in mentioned:
          if mentions['href'] == this_user_url:
            # hey, you've been mentioned. cool.
            this_user_mentioned = True
            break

      is_spam = spam.guess(atom_content,
          self.application.settings["private_path"],
          self.display["user"].username)

      if existing_content:
        # possible that it's picked up via feed, before we get the salmon call
        post_remote = existing_content
      else:
        post_remote = self.models.content_remote()
      post_remote.to_username = self.display["user"].username
      post_remote.from_user = signer_uri
      post_remote.username = user_remote.username
      post_remote.avatar = user_remote.avatar
      post_remote.date_created = datetime.datetime.strptime(
          salmon_doc.find('atom:published').string[:-6], '%Y-%m-%dT%H:%M:%S')
      post_remote.date_updated = datetime.datetime.strptime(
          salmon_doc.find('atom:updated').string[:-6], '%Y-%m-%dT%H:%M:%S')
      post_remote.comments_count = comments_count
      if comments_updated:
        post_remote.comments_updated = datetime.datetime.strptime(
            comments_updated[:-6], '%Y-%m-%dT%H:%M:%S')
      else:
        post_remote.comments_updated = None
      if is_spam:
        post_remote.is_spam = True
      else:
        spam.train_ham(atom_content, self.application.settings["private_path"],
            self.display["user"].username)
      post_remote.type = 'comment' if ref or (existing_content and
          existing_content.type == 'comment') else 'post'
      post_remote.title = salmon_doc.find('atom:title').string
      post_remote.post_id = salmon_doc.find('atom:id').string
      post_remote.link = salmon_doc.find('atom:link', rel='alternate')['href']
      post_remote.local_content_name = content.name if ref else ''
      post_remote.view = sanitized_atom_content
      post_remote.save()

      if ref:
        socialize.socialize(self, content)

      if ref:
        smtp.comment(self, post_remote.username, post_remote.from_user,
            self.display["user"].email, self.content_url(content, host=True),
            sanitized_atom_content)
      elif this_user_mentioned:
        smtp.comment(self, post_remote.username, post_remote.from_user,
            self.display["user"].email, post_remote.link,
            sanitized_atom_content, this_user_mentioned=True)
