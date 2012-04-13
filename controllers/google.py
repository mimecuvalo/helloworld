import json
import logging
import urllib

import tornado.auth
import tornado.escape
import tornado.web

from base import BaseHandler
from logic import content_remote

# This monkeypatches tornado to do sync instead of async
class GoogleHandler(BaseHandler,
                    tornado.auth.OAuth2Mixin):
  _OAUTH_REQUEST_TOKEN_URL = 'https://accounts.google.com/o/oauth2/token'
  _OAUTH_ACCESS_TOKEN_URL = 'https://accounts.google.com/o/oauth2/token'
  _OAUTH_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/auth'
  _OAUTH_SCOPE_URL = 'https://www.googleapis.com/auth/plus.me'

  def get(self):
    if not self.authenticate(author=True):
      return

    if self.get_argument("get_feed", None):
      # XXX google has no news feed api?
      self.set_status(400)
      return
    elif self.get_argument("code", False):
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

  def timeline_result(self, response):
    logging.error('google')
    logging.error(repr(response))

  def google_request(self, path, callback, access_token=None,
                       post_args=None, **args):
    url = "https://www.googleapis.com/plus/v1" + path
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
    self._on_google_request(callback, response)

  def _on_google_request(self, callback, response):
    if response.error:
      logging.warning("Error response %s fetching %s", response.error,
                      response.request.url)
      callback(None)
      return
    callback(tornado.escape.json_decode(response.body))

  def get_sync_authenticated_user(self, redirect_uri, client_id, client_secret,
                                  code, callback, extra_fields=None):
    args = {
      "client_id": client_id,
      "client_secret": client_secret,
      "code": code,
      "redirect_uri": redirect_uri,
      "extra_params": {"scope": self._OAUTH_SCOPE_URL,
                       "grant_type": 'authorization_code', }
    }

    response = content_remote.get_url(self._oauth_request_token_url(**args), post=True)
    self._on_access_token(callback, response)

  def _on_access_token(self, callback, response):
    if response.error:
      logging.warning("Could not fetch access token")
      callback(None)
      return

    access_token = tornado.escape.json_decode(response.body)
    callback(access_token)

  def _on_auth(self, access_token):
    if not access_token:
      raise tornado.web.HTTPError(500, "Google auth failed")

    user = self.get_author_user()
    user.google = json.dumps(access_token)
    user.save()

    self.redirect(self.nav_url(section='dashboard'))
