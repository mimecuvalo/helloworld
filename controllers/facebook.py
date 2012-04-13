import json
import logging

import tornado.auth
import tornado.escape
import tornado.web

from base import BaseHandler
from logic import content_remote

class FacebookHandler(BaseHandler,
                      tornado.auth.FacebookGraphMixin):

  def get(self):
    if not self.authenticate(author=True):
      return

    if self.get_argument("code", False):
      self.get_sync_authenticated_user(
        redirect_uri=self.nav_url(host=True, section='facebook'),
        client_id=self.settings["facebook_api_key"],
        client_secret=self.settings["facebook_secret"],
        code=self.get_argument("code"),
        callback=self.async_callback(
          self._on_auth))
      return
    self.authorize_redirect(redirect_uri=self.nav_url(host=True, section='facebook'),
                            client_id=self.settings["facebook_api_key"],
                            extra_params={"scope": "read_stream,publish_stream" })

  def get_sync_authenticated_user(self, redirect_uri, client_id, client_secret,
                                  code, callback, extra_fields=None):
    args = {
      "client_id": client_id,
      "client_secret": client_secret,
      "code": code,
      "redirect_uri": redirect_uri,
    }

    response = content_remote.get_url(self._oauth_request_token_url(**args), post=True)
    self._on_access_token(callback, response)

  def _on_access_token(self, callback, response):
    if response.error:
      logging.warning("Could not fetch access token")
      callback(None)
      return

    args = tornado.escape.parse_qs_bytes(tornado.escape.native_str(response.body))
    access_token = args["access_token"][-1]
    callback(access_token)

  def _on_auth(self, access_token):
    if not access_token:
      raise tornado.web.HTTPError(500, "Facebook auth failed")

    user = self.get_author_user()
    user.facebook = access_token
    user.save()

    self.redirect(self.nav_url(section='dashboard'))
