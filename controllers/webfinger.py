import urlparse

from base import BaseHandler
from logic import url_factory

import tornado.web

class WebfingerHandler(BaseHandler):
  def get(self):
    acct = self.get_argument("q").split('acct:')

    # remove acct: if it's there
    if len(acct) > 1:
      acct[0] = acct[1]

    if acct[0].find('@') != -1:
      acct = acct[0].split('@')[0]
    else:
      parsed_url = urlparse.urlparse(acct[0])
      content_url = url_factory.load_basic_parameters(self,
          url=parsed_url.path)
      acct = content_url['profile']

    self.display["acct"] = acct
    user = self.models.users.get(username=acct)[0]

    if not user:
      raise tornado.web.HTTPError(404)

    self.display["user"] = user

    self.set_header("Content-Type", "application/xrd+xml")
    self.fill_template("webfinger.html")
