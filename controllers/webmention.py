from BeautifulSoup import BeautifulSoup
import tornado.web

from base import BaseHandler
from logic import smtp
from logic import spam

class WebmentionHandler(BaseHandler):
  def post(self):
    acct = self.get_argument("q").split(':')

    # remove acct: if it's there
    if len(acct) > 1:
      acct[0] = acct[1].split('@')[0]

    acct = acct[0].split('@')[0]

    self.display["acct"] = acct
    user = self.models.users.get(username=acct)[0]

    if not user:
      raise tornado.web.HTTPError(400)

    self.display["user"] = user

    #self.request.body

  # tornado & python rock
  def check_xsrf_cookie(self):
    pass


"""
      if ref:
        smtp.comment(self, post_remote.username, post_remote.from_user,
            self.display["user"].email, self.content_url(content, host=True),
            sanitized_atom_content)
      elif this_user_mentioned:
        smtp.comment(self, post_remote.username, post_remote.from_user,
            self.display["user"].email, post_remote.link,
            sanitized_atom_content, this_user_mentioned=True)
"""
