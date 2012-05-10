import base64
import datetime
import json
import logging
import re
import os.path
import urllib

import tornado.auth
import tornado.escape
import tornado.web

from base import BaseHandler
from logic import content as content_logic
from logic import content_remote
from logic import url_factory

# This monkeypatches tornado to do sync instead of async
class TumblrHandler(BaseHandler,
                    tornado.auth.TwitterMixin):
                    # TODO: yeaaah, we should probably make a separate TumblrMixin but whatevs

  def get(self):
    if not self.authenticate(author=True):
      return

    if self.get_argument("get_feed", None):
      self.user = self.get_author_user()
      access_token = json.loads(self.user.tumblr)

      count = self.models.content_remote.get(to_username=self.user.username, type='tumblr').count()
      args = {}
      if count:
        jump = self.models.content_remote.get(to_username=self.user.username, type='tumblr')[count - 1:count]
        args['since_id'] = jump[0].post_id

      self.tumblr_request(
            "http://api.tumblr.com/v2/user/dashboard",
            self.timeline_result,
            access_token=access_token, **args)
      return
    elif self.get_argument("oauth_token", None):
      self.get_sync_authenticated_user(self._on_auth)
      return
    self.authorize_redirect()

  def post(self):
    if not self.authenticate(author=True):
      return

    op = self.get_argument('op', None)

    if op == 'favorite':
      self.favorite()
      return

    self.user = self.get_author_user()
    access_token = self.user.tumblr
    title = content_remote.strip_html(self.get_argument('title', ''))
    body = content_remote.strip_html(self.get_argument('view', '')) \
         + '\n' \
         + self.get_argument('url')

    # TODO, refactor out w FB logic
    thumb = self.get_argument('thumb', '')
    picture = None
    if thumb:
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

    self.tumblr_request(
            "http://api.tumblr.com/v2/blog/" + "" + "/post",
            self.status_update_result,
            access_token=access_token,
            post_args={"type": "text", "title": title, "body": body},)

  def favorite(self):
    # TODO, god this is confusing
    not_favorited = self.get_argument('not_favorited')
    operation = 'unlike' if not_favorited == '1' else 'like'
    post_id = self.get_argument('post_id', '')

    self.user = self.get_author_user()
    access_token = json.loads(self.user.tumblr)
    self.tumblr_request(
            "http://api.tumblr.com/v2/user/" + operation,
            self.favorite_result,
            access_token=access_token,
            post_args={ 'id': post_id })

  def status_update_result(self, response):
    pass

  def favorite_result(self, response):
    pass

  def timeline_result(self, response):
    posts = response['response']['posts']
    for post in posts:
      exists = self.models.content_remote.get(to_username=self.user.username, type='tumblr', post_id=str(post['id']))[0]

      if exists:
        continue
      else:
        new_post = self.models.content_remote()

      new_post.to_username = self.user.username
      new_post.username = post['blog_name']
      new_post.from_user = 'http://' + post['blog_name'] + 'twitter.com/'
      #new_post.avatar = post['user']['profile_image_url']

      parsed_date = datetime.datetime.utcfromtimestamp(post['timestamp'])

      # we don't keep items that are over 30 days old
      if parsed_date < datetime.datetime.utcnow() - datetime.timedelta(days=self.constants['feed_max_days_old']):
        continue

      new_post.date_created = parsed_date
      new_post.date_updated = None
      new_post.comments_count = post['note_count']
      new_post.comments_updated = None
      new_post.type = 'tumblr'
      new_post.title = post['title']
      new_post.post_id = str(post['id'])
      new_post.link = post['post_url']
      new_post.view = content_remote.sanitize(tornado.escape.xhtml_unescape(post['body']))
      new_post.save()

    count = self.models.content_remote.get(to_username=self.user.username, type='tumblr', deleted=False).count()
    self.write(json.dumps({ 'count': count }))

  def tumblr_request(self, path, callback, access_token=None,
                      post_args=None, **args):
    #http://www.tumblr.com/docs/en/api/v2

    url = path
    # Add the OAuth resource request signature if we have credentials
    if access_token:
      all_args = {}
      all_args.update(args)
      all_args.update(post_args or {})
      method = "POST" if post_args is not None else "GET"
      oauth = self._oauth_request_parameters(
          url, access_token, all_args, method=method)
      args.update(oauth)
      args.update(post_args)
    if args:
      url += "?" + urllib.urlencode(args)

    response = content_remote.get_url(url, post=(post_args is not None))
    self._on_twitter_request(callback, response)

  def authorize_redirect(self, callback_uri=None, extra_params=None,
                         http_client=None):
    """Redirects the user to obtain OAuth authorization for this service.

    Twitter and FriendFeed both require that you register a Callback
    URL with your application. You should call this method to log the
    user in, and then call get_authenticated_user() in the handler
    you registered as your Callback URL to complete the authorization
    process.

    This method sets a cookie called _oauth_request_token which is
    subsequently used (and cleared) in get_authenticated_user for
    security purposes.
    """
    if callback_uri and getattr(self, "_OAUTH_NO_CALLBACKS", False):
      raise Exception("This service does not support oauth_callback")

    if getattr(self, "_OAUTH_VERSION", "1.0a") == "1.0a":
      response = content_remote.get_url(self._oauth_request_token_url(callback_uri=callback_uri, extra_params=extra_params))
      self._on_request_token(self._OAUTH_AUTHORIZE_URL, callback_uri, response)
    else:
      response = content_remote.get_url(self._oauth_request_token_url())
      self._on_request_token(self._OAUTH_AUTHORIZE_URL, callback_uri, response)

  def get_sync_authenticated_user(self, callback, http_client=None):
    """Gets the OAuth authorized user and access token on callback.

    This method should be called from the handler for your registered
    OAuth Callback URL to complete the registration process. We call
    callback with the authenticated user, which in addition to standard
    attributes like 'name' includes the 'access_key' attribute, which
    contains the OAuth access you can use to make authorized requests
    to this service on behalf of the user.

    """
    request_key = tornado.escape.utf8(self.get_argument("oauth_token"))
    oauth_verifier = self.get_argument("oauth_verifier", None)
    request_cookie = self.get_cookie("_oauth_request_token")
    if not request_cookie:
      logging.warning("Missing OAuth request token cookie")
      callback(None)
      return
    self.clear_cookie("_oauth_request_token")
    cookie_key, cookie_secret = [base64.b64decode(tornado.escape.utf8(i)) for i in request_cookie.split("|")]
    if cookie_key != request_key:
      logging.info((cookie_key, request_key, request_cookie))
      logging.warning("Request token does not match cookie")
      callback(None)
      return
    token = dict(key=cookie_key, secret=cookie_secret)
    if oauth_verifier:
      token["verifier"] = oauth_verifier

    response = content_remote.get_url(self._oauth_access_token_url(token))
    self._on_access_token(callback, response)

  def _on_access_token(self, callback, response):
    if response.error:
      logging.warning("Could not fetch access token")
      callback(None)
      return

    access_token = tornado.auth._oauth_parse_response(response.body)
    callback(access_token)

  def _on_auth(self, access_token):
    if not access_token:
      raise tornado.web.HTTPError(500, "Tumblr auth failed")

    user = self.get_author_user()
    user.tumblr = json.dumps(access_token)
    user.save()

    self.redirect(self.nav_url(section='dashboard'))

  def delete(self):
    if not self.authenticate(author=True):
      return
    user = self.get_author_user()
    user.tumblr = None
    user.save()
