import httplib
import logging
import urllib2
import urlparse

import tornado.auth
import tornado.escape
import tornado.web

from base import BaseHandler

class TwitterAuthHandler(BaseHandler,
                         tornado.auth.TwitterMixin):
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
      url = urlparse.urlparse(self._oauth_request_token_url(callback_uri=callback_uri, extra_params=extra_params))
      conn = httplib.HTTPConnection(url.netloc)
      conn.request("GET", url.path + '?' + url.query)
      class Response:
        def __init__(self, response):
          self.error = False
          self.body = response.read()
      response = Response(conn.getresponse())
      conn.close()
      self._on_request_token(self._OAUTH_AUTHORIZE_URL, callback_uri, response)
    else:
      url = urlparse.urlparse(self._oauth_request_token_url())
      conn = httplib.HTTPConnection(url.netloc)
      conn.request("GET", url.path + '?' + url.query)
      class Response:
        def __init__(self, response):
          self.error = False
          self.body = response.read()
      response = Response(conn.getresponse())
      conn.close()
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

    url = urlparse.urlparse(self._oauth_access_token_url(token))
    conn = httplib.HTTPConnection(url.netloc)
    conn.request("GET", url.path + '?' + url.query)
    class Response:
      def __init__(self, response):
        self.error = False
        self.body = response.read()
    response = Response(conn.getresponse())
    conn.close()
    self._on_access_token(callback, response)

  def get(self):
    if self.get_argument("oauth_token", None):
      self.get_sync_authenticated_user(self.async_callback(self._on_auth))
      return
    self.authorize_redirect()

  def _on_auth(self, user):
    if not user:
      raise tornado.web.HTTPError(500, "Twitter auth failed")
    import logging
    logging.error(repr(user))
    # Save the user using, e.g., set_secure_cookie()
