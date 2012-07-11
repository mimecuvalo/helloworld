import datetime
import json
import logging
import os.path
import re
import urllib

import tornado.auth
import tornado.escape
import tornado.web

from base import BaseHandler
from logic import content_remote
from logic import url_factory

# This monkeypatches tornado to do sync instead of async
class FacebookHandler(BaseHandler,
                      tornado.auth.FacebookGraphMixin):

  def get(self):
    if not self.authenticate(author=True):
      return

    if self.get_argument("get_feed", None):
      self.user = self.get_author_user()
      access_token = self.user.facebook
      self.facebook_request(
            "/me/home",
            access_token=access_token, callback=self.timeline_result)
      return
    elif self.get_argument("code", False):
      self.get_sync_authenticated_user(
        redirect_uri=self.nav_url(host=True, section='facebook'),
        client_id=self.settings["facebook_api_key"],
        client_secret=self.settings["facebook_secret"],
        code=self.get_argument("code"),
        callback=self.async_callback(
          self._on_auth))
      return
    self.authorize_redirect(
        redirect_uri=self.nav_url(host=True, section='facebook'),
        client_id=self.settings["facebook_api_key"],
        extra_params={"scope": "read_stream,publish_stream" })

  def post(self):
    if not self.authenticate(author=True):
      return

    op = self.get_argument('op', None)

    if op == 'favorite':
      self.favorite()
      return

    self.user = self.get_author_user()
    access_token = self.user.facebook
    title = self.get_argument('title', '')
    view = self.get_argument('view', '')
    status = (content_remote.strip_html(title)
        + ('\n' if title and view else '')
        + content_remote.strip_html(view.replace('<br>', ' '))
        + ('\n' if title or view else '')
        + self.get_argument('url'))

    thumb = self.get_argument('thumb', '')
    picture = None
    if thumb:
      if not thumb.startswith('http://'):
        thumb = url_factory.clean_filename(thumb)
        thumb = thumb[len(url_factory.resource_url(self)) + 1:]
        thumb = url_factory.resource_directory(self, thumb)
        picture = thumb

        basename = os.path.basename(thumb)
        dirname = os.path.dirname(thumb)
        if os.path.basename(dirname) == 'thumbs':
          parent_dir = os.path.dirname(dirname)
          original_dir = os.path.join(parent_dir, 'original')
          original_img = os.path.join(original_dir, basename)
          if os.path.exists(original_img):
            picture = original_img

        picture = picture[len(self.application.settings["static_path"]) + 1:]
        picture = self.static_url(picture, include_host=True)
      else:
        picture = thumb

    post_args = {"message": status, "picture": picture}
    video = re.compile(r'<iframe[^>]*(youtube|vimeo)[^>]*>.*?</iframe>',
        re.M | re.S).search(view)
    if video:
      video = video.group(0)
      is_youtube = re.compile(r'<iframe[^>]*(youtube)[^>]*>', re.M).search(
          view)
      if is_youtube:
        video_id = re.compile(r'<iframe[^>]*youtube.com/embed/([^\?]*)[^>]*>',
            re.M).search(view).group(1)
        source = 'http://www.youtube.com/e/' + video_id + '?autoplay=1'
      else:
        video_id = re.compile(r'<iframe[^>]*vimeo.com/video/([^\?"]*)[^>]*>',
            re.M).search(view).group(1)
        source = ('https://secure.vimeo.com/moogaloop.swf?clip_id=' +
            video_id + '&autoplay=1')
      post_args['source'] = source

    self.facebook_request(
            "/me/feed",
            self.status_update_result,
            access_token=access_token,
            post_args=post_args,)

  def favorite(self):
    not_favorited = self.get_argument('not_favorited')
    post_args = {}
    if not_favorited == '1':
      post_args['method'] = 'delete'
    post_id = self.get_argument('post_id', '')

    self.user = self.get_author_user()
    access_token = self.user.facebook
    self.facebook_request(
            "/" + post_id + "/likes",
            self.favorite_result,
            access_token=access_token,
            post_args=post_args,)

  def status_update_result(self, response):
    pass

  def favorite_result(self, response):
    pass

  def timeline_result(self, response):
    # Check if our OAuth key has expired
    if response.has_key('error') and response['error']['type']
        == 'OAuthException':
      self.delete()
      return

    posts = response['data']
    for post in posts:
      exists = self.models.content_remote.get(to_username=self.user.username,
          type='facebook', post_id=post['id'])[0]

      date_updated = None
      if post.has_key('updated_time'):
        date_updated = datetime.datetime.strptime(post['updated_time'][:-5],
            '%Y-%m-%dT%H:%M:%S')

      if exists:
        if date_updated and date_updated != exists.date_updated \
            or post['comments']['count'] != exists.comments_count:
          new_post = exists
        else:
          continue
      else:
        new_post = self.models.content_remote()

      new_post.to_username = self.user.username
      new_post.username = post['from']['name']
      if post.has_key('actions'):
        new_post.from_user = post['actions'][0]['link']
      #new_post.avatar = tweet['user']['profile_image_url']

      parsed_date = datetime.datetime.strptime(post['created_time'][:-5],
          '%Y-%m-%dT%H:%M:%S')

      # we don't keep items that are over 30 days old
      if parsed_date < datetime.datetime.utcnow() - datetime.timedelta(
          days=self.constants['feed_max_days_old']):
        continue

      new_post.date_created = parsed_date
      new_post.date_updated = date_updated
      new_post.comments_count = 0
      new_post.comments_updated = None
      new_post.type = 'facebook'
      new_post.title = ''
      new_post.post_id = post['id']
      new_post.comments_count = post['comments']['count']
      if post['comments']['count'] and post['comments']['data']:
        last_updated = post['comments']['data'][len(
            post['comments']['data']) - 1]['created_time']
        new_post.comments_updated = datetime.datetime.strptime(
            last_updated[:-5], '%Y-%m-%dT%H:%M:%S')
      if post.has_key('actions'):
        new_post.link = post['actions'][0]['link']
      elif post.has_key('link'):
        new_post.link = post['link']
      view = ""
      if post.has_key('message'):
        view += post['message'] + "<br>"
      if post.has_key('caption'):
        view += post['caption'] + "<br>"
      if post.has_key('description'):
        view += post['description'] + "<br>"
      if post.has_key('story'):
        view += post['story'] + "<br>"
      view = tornado.escape.linkify(view)
      if post.has_key('picture'):
        view = '<img src="' + post['picture'] + '">' + view
      new_post.view = content_remote.sanitize(tornado.escape.xhtml_unescape(
          view))
      new_post.save()

      # comments
      if post['comments']['count']:
        for comment in post['comments']['data']:
          exists = self.models.content_remote.get(
              to_username=self.user.username, post_id=comment['id'])[0]
          if exists:
            continue
          else:
            new_comment = self.models.content_remote()

          new_comment.to_username = self.user.username
          new_comment.username = comment['from']['name']
          new_comment.from_user = ('http://facebook.com/' +
              comment['from']['id'])
          date_created = datetime.datetime.strptime(
              comment['created_time'][:-5], '%Y-%m-%dT%H:%M:%S')
          new_comment.date_created = date_created
          new_comment.type = 'remote-comment'
          new_comment.thread = post['id']
          new_comment.post_id = comment['id']
          if post.has_key('actions'):
            new_comment.link = post['actions'][0]['link']
          new_comment.view = comment['message']
          new_comment.save()

    count = self.models.content_remote.get(to_username=self.user.username,
        type='facebook', deleted=False).count()
    self.write(json.dumps({ 'count': count }))

  def facebook_request(self, path, callback, access_token=None,
                       post_args=None, **args):
    """Fetches the given relative API path, e.g., "/btaylor/picture"

    If the request is a POST, post_args should be provided. Query
    string arguments should be given as keyword arguments.

    An introduction to the Facebook Graph API can be found at
    http://developers.facebook.com/docs/api

    Many methods require an OAuth access token which you can obtain
    through authorize_redirect() and get_authenticated_user(). The
    user returned through that process includes an 'access_token'
    attribute that can be used to make authenticated requests via
    this method. Example usage::

        class MainHandler(tornado.web.RequestHandler,
                          tornado.auth.FacebookGraphMixin):
            @tornado.web.authenticated
            @tornado.web.asynchronous
            def get(self):
                self.facebook_request(
                    "/me/feed",
                    post_args={"message": "I am posting from my Tornado application!"},
                    access_token=self.current_user["access_token"],
                    callback=self.async_callback(self._on_post))

            def _on_post(self, new_entry):
                if not new_entry:
                    # Call failed; perhaps missing permission?
                    self.authorize_redirect()
                    return
                self.finish("Posted a message!")

    """
    url = "https://graph.facebook.com" + path
    all_args = {}
    if access_token:
      all_args["access_token"] = access_token
      all_args.update(args)
      all_args.update(post_args or {})
    if all_args:
      url += "?" + urllib.urlencode(all_args)

    response = content_remote.get_url(url, post=(post_args is not None))
    self._on_facebook_request(callback, response)

  def get_sync_authenticated_user(self, redirect_uri, client_id, client_secret,
                                  code, callback, extra_fields=None):
    args = {
      "client_id": client_id,
      "client_secret": client_secret,
      "code": code,
      "redirect_uri": redirect_uri,
    }

    response = content_remote.get_url(self._oauth_request_token_url(**args),
        post=True)
    self._on_access_token(callback, response)

  def _on_access_token(self, callback, response):
    if response.error:
      logging.warning("Could not fetch access token")
      callback(None)
      return

    args = tornado.escape.parse_qs_bytes(
        tornado.escape.native_str(response.body))
    access_token = args["access_token"][-1]
    callback(access_token)

  def _on_auth(self, access_token):
    if not access_token:
      raise tornado.web.HTTPError(500, "Facebook auth failed")

    user = self.get_author_user()
    user.facebook = access_token
    user.save()

    self.redirect(self.nav_url(section='dashboard'))

  def delete(self):
    if not self.authenticate(author=True):
      return
    user = self.get_author_user()
    user.facebook = None
    user.save()
