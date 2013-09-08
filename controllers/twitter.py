import base64
import datetime
import email.encoders
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
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
class TwitterHandler(BaseHandler,
                     tornado.auth.TwitterMixin):
  UPDATE_WITH_MEDIA_URL = \
      "https://upload.twitter.com/1/statuses/update_with_media.json"

  def get(self):
    if not self.authenticate(author=True):
      return

    if self.get_argument("get_feed", None):
      self.user = self.get_author_user()
      access_token = json.loads(self.user.twitter)

      count = self.models.content_remote.get(to_username=self.user.username,
          type='twitter').count()
      args = {}
      if count:
        jump = self.models.content_remote.get(to_username=self.user.username,
            type='twitter')[count - 1:count]
        args['since_id'] = jump[0].post_id

      self.twitter_request(
            "/statuses/home_timeline",
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
    access_token = json.loads(self.user.twitter)
    #thumb = self.get_argument('thumb', '')
    # XXX TODO multipart doesn't work for some reason right now... arrrgh
    thumb = None
    text_length = 79 if thumb else 99
    title = self.get_argument('title', '')
    view = self.get_argument('view', '')
    status = (content_logic.ellipsize(content_remote.strip_html(
        title), 18, including_dots=True) +
        (': ' if title and view else '') +
        content_logic.ellipsize(content_remote.strip_html(
            view.replace('<br>', ' ')), text_length, including_dots=True) +
        (' ' if title or view else '') +
        self.get_argument('url'))

    if thumb:
      thumb = url_factory.clean_filename(thumb)
      thumb = thumb[len(url_factory.resource_url(self)) + 1:]
      thumb = url_factory.resource_directory(self, thumb)
      image = thumb

      basename = os.path.basename(thumb)
      dirname = os.path.dirname(thumb)
      if os.path.basename(dirname) == 'thumbs':
        parent_dir = os.path.dirname(dirname)
        original_dir = os.path.join(parent_dir, 'original')
        original_img = os.path.join(original_dir, basename)
        if (os.path.exists(original_img) and
            os.path.getsize(original_img) < 3145728):
          image = original_img

      f = open(image, 'r')
      image_data = f.read()
      f.close()

      self.twitter_request(
              self.UPDATE_WITH_MEDIA_URL,
              self.status_update_result,
              access_token=access_token,
              post_args={"status": status, "media[]": image_data })
    else:
      self.twitter_request(
              "/statuses/update",
              self.status_update_result,
              access_token=access_token,
              post_args={"status": status})

  def favorite(self):
    not_favorited = self.get_argument('not_favorited')
    operation = 'destroy' if not_favorited == '1' else 'create'
    post_id = self.get_argument('post_id', '')

    self.user = self.get_author_user()
    access_token = json.loads(self.user.twitter)
    self.twitter_request(
            "/favorites/" + operation + "/" + post_id,
            self.favorite_result,
            access_token=access_token,
            post_args={})

  def status_update_result(self, response):
    pass

  def favorite_result(self, response):
    pass

  def timeline_result(self, tweets):
    for tweet in tweets:
      exists = self.models.content_remote.get(to_username=self.user.username,
          type='twitter', post_id=str(tweet['id']))[0]

      if exists:
        continue
      else:
        new_tweet = self.models.content_remote()

      new_tweet.to_username = self.user.username
      new_tweet.username = tweet['user']['screen_name']
      new_tweet.from_user = ('http://twitter.com/' +
          tweet['user']['screen_name'])
      new_tweet.avatar = tweet['user']['profile_image_url']

      parsed_date = re.compile(r'\+.....').sub('', tweet['created_at'])
      parsed_date = datetime.datetime.strptime(parsed_date,
          '%a %b %d %H:%M:%S %Y')

      # we don't keep items that are over 30 days old
      if parsed_date < datetime.datetime.utcnow() - datetime.timedelta(
          days=self.constants['feed_max_days_old']):
        continue

      new_tweet.date_created = parsed_date
      new_tweet.date_updated = None
      new_tweet.comments_count = 0
      new_tweet.comments_updated = None
      new_tweet.type = 'twitter'
      new_tweet.title = ''
      new_tweet.post_id = str(tweet['id'])
      new_tweet.link = ('http://twitter.com/' + tweet['user']['screen_name'] +
          '/status/' + str(tweet['id']))
      if tweet.has_key('retweeted_status'):
        text = tornado.escape.linkify(tweet['retweeted_status']['text'])
        text += ('<br><span class="hw-retweeted-by">'
            + self.locale.translate(
              'retweeted by <a href="%(link)s">%(tweeter)s</a>')
            % { 'link': 'http://twitter.com/' + tweet['user']['screen_name'],
                'tweeter': tweet['user']['screen_name'] }
            + '</span>')
        new_tweet.username = tweet['retweeted_status']['user']['screen_name']
        new_tweet.from_user = ('http://twitter.com/' +
            tweet['retweeted_status']['user']['screen_name'])
        new_tweet.avatar = \
            tweet['retweeted_status']['user']['profile_image_url']
      else:
        text = tornado.escape.linkify(tweet['text'])
      text = re.compile(r'#(\w+)', re.M | re.U).sub(
          r'<a href="https://twitter.com/#!/search/%23\1" rel="tag">#\1</a>',
          text)
      text = re.compile(r'@(\w+)', re.M | re.U).sub(
          r'<a href="https://twitter.com/#!/\1">@\1</a>', text)
      new_tweet.view = content_remote.sanitize(
          tornado.escape.xhtml_unescape(text))
      new_tweet.save()

    count = self.models.content_remote.get(to_username=self.user.username,
        type='twitter', deleted=False).count()
    self.write(json.dumps({ 'count': count }))

  def twitter_request(self, path, callback, access_token=None,
                      post_args=None, **args):
    """Fetches the given API path, e.g., "/statuses/user_timeline/btaylor"

    The path should not include the format (we automatically append
    ".json" and parse the JSON output).

    If the request is a POST, post_args should be provided. Query
    string arguments should be given as keyword arguments.

    All the Twitter methods are documented at
    http://apiwiki.twitter.com/Twitter-API-Documentation.

    Many methods require an OAuth access token which you can obtain
    through authorize_redirect() and get_authenticated_user(). The
    user returned through that process includes an 'access_token'
    attribute that can be used to make authenticated requests via
    this method. Example usage::

        class MainHandler(tornado.web.RequestHandler,
                          tornado.auth.TwitterMixin):
            @tornado.web.authenticated
            @tornado.web.asynchronous
            def get(self):
                self.twitter_request(
                    "/statuses/update",
                    post_args={"status": "Testing Tornado Web Server"},
                    access_token=user["access_token"],
                    callback=self.async_callback(self._on_post))

            def _on_post(self, new_entry):
                if not new_entry:
                    # Call failed; perhaps missing permission?
                    self.authorize_redirect()
                    return
                self.finish("Posted a message!")

    """
    if path.startswith('http:') or path.startswith('https:'):
      # Raw urls are useful for e.g. search which doesn't follow the
      # usual pattern: http://search.twitter.com/search.json
      url = path
    else:
      url = "http://api.twitter.com/1" + path + ".json"
    # Add the OAuth resource request signature if we have credentials
    if access_token:
      all_args = {}
      all_args.update(args)
      if path != self.UPDATE_WITH_MEDIA_URL:
        all_args.update(post_args or {})
      method = "POST" if post_args is not None else "GET"
      oauth = self._oauth_request_parameters(
          url, access_token, all_args, method=method)
      args.update(oauth)
      if post_args and path != self.UPDATE_WITH_MEDIA_URL:
        args.update(post_args)
    if args:
      url += "?" + urllib.urlencode(args)

    body = None
    if path == self.UPDATE_WITH_MEDIA_URL:
      msg = MIMEMultipart("form-data")
      for arg in post_args:
        if arg == 'media[]':
          mime_image = MIMEImage(post_args[arg],
              _encoder = email.encoders.encode_noop)
          mime_image.add_header("Content-Disposition", "form-data",
              name="media[]", filename="media[]")
          mime_image.add_header("Content-Length", str(len(post_args[arg])))
          msg.attach(mime_image)
        else:
          mime_text = MIMEText(post_args[arg])
          mime_text.add_header("Content-Disposition", "form-data", name=arg)
          mime_text.set_charset("utf-8")
          msg.attach(mime_text)
      body = msg.as_string()

    response = content_remote.get_url(url, post=(post_args is not None),
        body=body)
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
      response = content_remote.get_url(self._oauth_request_token_url(
          callback_uri=callback_uri, extra_params=extra_params))
      self._on_request_token(self._OAUTH_AUTHORIZE_URL, callback_uri, self.noop, response)
    else:
      response = content_remote.get_url(self._oauth_request_token_url())
      self._on_request_token(self._OAUTH_AUTHORIZE_URL, callback_uri, self.noop, response)

  def noop(self):
    pass

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
    cookie_key, cookie_secret = [base64.b64decode(tornado.escape.utf8(i))
        for i in request_cookie.split("|")]
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
      raise tornado.web.HTTPError(500, "Twitter auth failed")

    user = self.get_author_user()
    user.twitter = json.dumps(access_token)
    user.save()

    self.redirect(self.nav_url(section='dashboard'))

  def delete(self):
    if not self.authenticate(author=True):
      return
    user = self.get_author_user()
    user.twitter = None
    user.save()
