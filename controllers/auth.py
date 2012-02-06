import json
import tornado.auth
import tornado.escape
import tornado.web
import urllib
import urllib2

from base import BaseHandler
from logic import users

# BrowserId: https://browserid.org/developers
# or OAUTH
class AuthHandler(BaseHandler, tornado.auth.GoogleMixin):
  def post(self):
    assertion = self.get_argument('assertion')
    audience = self.request.host
    try:
      browserid = urllib2.urlopen("https://browserid.org/verify",
                                  "assertion=%(assertion)s&audience=%(audience)s"
                                  % { 'assertion': assertion, 'audience': audience })
      response = json.loads(browserid.read())
    except:
      raise tornado.web.HTTPError(500, "BrowserId auth failed")

    if response['status'] == 'okay':
      self.get_webfinger_data(response)
      self.set_secure_cookie("user", tornado.escape.json_encode(response), path=self.base_path, HttpOnly=True)
    else:
      raise tornado.web.HTTPError(500, "BrowserId auth failed")

  def get(self):
    if self.current_user:
      self.redirect(self.get_argument("next", self.nav_url()))
    else:
      self.fill_template("login.html")

  def get_webfinger_data(self, user):
    try:
      lrdd = users.get_lrdd_link('http://' + user['email'].split('@')[1])
    except:
      return

    webfinger_doc = users.get_webfinger(lrdd, user['email'])
    if webfinger_doc:
      ostatus_subscribe = webfinger_doc.find('link', rel='http://ostatus.org/schema/1.0/subscribe')
      if ostatus_subscribe:
        user['ostatus_subscribe'] = ostatus_subscribe['template']

class AuthLogoutHandler(BaseHandler):
  def get(self):
    self.clear_cookie("user", path=self.base_path)
    self.redirect(self.get_argument("next", self.nav_url()))
