from base import BaseHandler

from BeautifulSoup import BeautifulSoup
import feedparser
import tornado.web

from logic import remote_content

class PushHandler(BaseHandler):
  def get(self):
    self.write(self.get_argument('hub.challenge'))

  # tornado & python rock
  def check_xsrf_cookie(self):
    pass

  def post(self):
    user = self.models.users.get(username=self.breadcrumbs["profile"])[0]

    if not user:
      raise tornado.web.HTTPError(404)

    feed_doc = feedparser.parse(self.request.body)
    profile_url = feed_doc.feed['link']
    remote_user = self.models.users_remote.get(local_username=user.username, profile_url=profile_url)[0]

    if not remote_user:
      raise tornado.web.HTTPError(404)

    remote_content.parse_feed(self.models, remote_user, parsed_feed=self.request.body)
