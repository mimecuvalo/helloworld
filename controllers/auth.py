import json
import tornado.auth
import tornado.escape
import tornado.web
import urllib
import urllib2

from base import BaseHandler
from logic import users

# BrowserId: https://browserid.org/developers
class AuthHandler(BaseHandler, tornado.auth.GoogleMixin):
  def auth0(self):
    code = self.get_argument('code')
    json_header = {'content-type': 'application/json'}
    token_url = "https://{domain}/oauth/token".format(domain=self.constants['auth0_client_domain'])

    token_payload = {
      'client_id':     self.constants['auth0_client_id'],
      'client_secret': self.constants['auth0_client_secret'],
      'redirect_uri':  self.constants['auth0_redirect_uri'],
      'code':          code,
      'grant_type':    'authorization_code'
    }
    request = urllib2.Request(token_url, data=json.dumps(token_payload), headers=json_header)
    token_info = json.loads(urllib2.urlopen(request).read())
    user_url = "https://{domain}/userinfo?access_token={access_token}" \
        .format(domain=self.constants['auth0_client_domain'], access_token=token_info['access_token'])

    user_info = json.loads(urllib2.urlopen(user_url).read())
    self.set_secure_cookie("user", tornado.escape.json_encode(user_info),
        path=self.base_path, HttpOnly=True)
    self.redirect('/dashboard')

    """
def post(self):
    assertion = self.get_argument('assertion')
    audience = self.request.host
    try:
      browserid = urllib2.urlopen("https://verifier.login.persona.org/verify",
          "assertion=%(assertion)s&audience=%(audience)s"
          % { 'assertion': assertion, 'audience': audience })
      response = json.loads(browserid.read())
    except:
      raise tornado.web.HTTPError(500, "BrowserId auth failed")

    if response['status'] == 'okay':
      self.get_webfinger_data(response)
      self.set_secure_cookie("user", tornado.escape.json_encode(response),
          path=self.base_path, HttpOnly=True)
    else:
      raise tornado.web.HTTPError(500, "BrowserId auth failed")
    """

  def get(self):
    if self.current_user:
      self.redirect(self.get_argument("next", self.nav_url()))
    elif (self.get_argument('code', False)):
      self.auth0()
    else:
      self.fill_template("login.html")

  def get_webfinger_data(self, user):
    try:
      lrdd = users.get_lrdd_link('http://' + user['email'].split('@')[1])
    except:
      return

    webfinger_doc = users.get_webfinger(lrdd, user['email'])
    if webfinger_doc:
      ostatus_subscribe = webfinger_doc.find('link',
          rel='http://ostatus.org/schema/1.0/subscribe')
      if ostatus_subscribe:
        user['ostatus_subscribe'] = ostatus_subscribe['template']

class AuthLogoutHandler(BaseHandler):
  def get(self):
    self.clear_cookie("user", path=self.base_path)
    self.redirect(self.get_argument("next", self.nav_url()))
