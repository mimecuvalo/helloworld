import base64
import json
import logging

import tornado.auth
import tornado.escape
import tornado.web

from base import BaseHandler
from logic import content_remote

class GoogleHandler(BaseHandler,
                    tornado.auth.OAuth2Mixin):
  _OAUTH_REQUEST_TOKEN_URL = 'https://accounts.google.com/o/oauth2/token'
  _OAUTH_ACCESS_TOKEN_URL = 'https://accounts.google.com/o/oauth2/token'
  _OAUTH_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/auth'

  def get(self):
    if not self.authenticate(author=True):
      return

    if self.get_argument("oauth_token", False):
        self.get_sync_authenticated_user(
          redirect_uri='/google',
          client_id=self.settings["google_api_key"],
          client_secret=self.settings["google_secret"],
          code=self.get_argument("oauth_token"),
          callback=self.async_callback(
            self._on_auth))
        return
    self.authorize_redirect(redirect_uri='/google',
                            client_id=self.settings["google_api_key"],
                            extra_params={"scope": "https://www.googleapis.com/auth/plus"})

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
      raise tornado.web.HTTPError(500, "Google auth failed")

    user = self.get_author_user()
    user.google = json.dumps(access_token)
    user.save()

    self.redirect(self.nav_url(section='dashboard'))
