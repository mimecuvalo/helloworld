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
  _OAUTH_SCOPE_URL = 'https://www.googleapis.com/auth/plus.me'

  def get(self):
    if not self.authenticate(author=True):
      return

    if self.get_argument("code", False):
      self.get_sync_authenticated_user(
        redirect_uri=self.nav_url(host=True, section='google'),
        client_id=self.settings["google_api_key"],
        client_secret=self.settings["google_secret"],
        code=self.get_argument("code"),
        callback=self.async_callback(
          self._on_auth))
      return
    self.authorize_redirect(redirect_uri=self.nav_url(host=True, section='google'),
                            client_id=self.settings["google_api_key"],
                            extra_params={"scope": self._OAUTH_SCOPE_URL,
                                          "response_type": "code", })

  def get_sync_authenticated_user(self, redirect_uri, client_id, client_secret,
                                  code, callback, extra_fields=None):
    args = {
      "grant_type": 'authorization_code',
      "client_id": client_id,
      "client_secret": client_secret,
      "code": code,
      "redirect_uri": redirect_uri,
      "scope": self._OAUTH_SCOPE_URL,
    }

    fields = set(['id', 'name', 'first_name', 'last_name',
                  'locale', 'picture', 'link'])
    if extra_fields:
      fields.update(extra_fields)

    response = content_remote.get_url(self._oauth_access_token_url(**args))
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
