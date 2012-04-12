import logging

import tornado.auth
import tornado.escape
import tornado.web

class TwitterAuthHandler(tornado.web.RequestHandler,
                         tornado.auth.TwitterMixin):
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

    import httplib
    import urlparse
    url = urlparse.urlparse(self._oauth_access_token_url(token))
    conn = httplib.HTTPSConnection(url.netloc)
    conn.request("GET", url.path)
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
