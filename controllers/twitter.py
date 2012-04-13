import base64
import json
import logging
import re
import urllib

import tornado.auth
import tornado.escape
import tornado.web

from base import BaseHandler
from logic import content_remote

# This monkeypatches tornado to do sync instead of async
class TwitterHandler(BaseHandler,
                     tornado.auth.TwitterMixin):
  def get(self):
    if not self.authenticate(author=True):
      return

    if self.get_argument("get_feed", None):
      self.user = self.get_author_user()
      access_token = json.loads(self.user.twitter)
      self.twitter_request(
            "/statuses/home_timeline",
            self.timeline_result,
            access_token=access_token)
      return
    elif self.get_argument("oauth_token", None):
      self.get_sync_authenticated_user(self._on_auth)
      return
    self.authorize_redirect()

  def timeline_result(self, tweets):
    for tweet in tweets:
      exists = self.models.content_remote.get(to_username=self.user.username, post_id=tweet['id'])[0]

      if exists:
        continue
      else:
        new_tweet = self.models.content_remote()

      new_tweet.to_username = self.user.username
      new_tweet.username = tweet['user']['screen_name']
      new_tweet.from_user = 'http://twitter.com/' + tweet['user']['screen_name']
      new_tweet.avatar = tweet['user']['profile_image_url']

      parsed_date = re.compile(r'\+.....').sub('', tweet['created_at'])
      parsed_date = datetime.datetime.strptime(parsed_date, '%a %b %d %H:%M:%S %Y')

      # we don't keep items that are over 30 days old
      if parsed_date < datetime.datetime.utcnow() - datetime.timedelta(days=max_days_old):
        continue

      new_tweet.date_created = parsed_date
      new_tweet.date_updated = None
      new_tweet.comments_count = 0
      new_tweet.comments_updated = None
      new_tweet.type = 'twitter'
      new_tweet.title = ''
      new_tweet.post_id = tweet['id']
      new_tweet.link = 'http://twitter.com/' + tweet['user']['screen_name'] + '/status/' + tweet['id']
      new_tweet.view = tweet['text']
      new_tweet.save()

    count = self.models.content_remote.get(to_username=user.username, type='twitter', deleted=False).count()
    json = json.dumps({ 'count': count })
    self.write(json)

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
      all_args.update(post_args or {})
      method = "POST" if post_args is not None else "GET"
      oauth = self._oauth_request_parameters(
          url, access_token, all_args, method=method)
      args.update(oauth)
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
      raise tornado.web.HTTPError(500, "Twitter auth failed")

    user = self.get_author_user()
    user.twitter = json.dumps(access_token)
    user.save()

    self.redirect(self.nav_url(section='dashboard'))
