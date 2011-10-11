import tornado.web

from base import BaseHandler
from logic import users
from models import db

class DashboardHandler(BaseHandler):
  def get(self):
    if not self.authenticate(author=True):
      return

    self.display["initial_media"] = self.get_argument('reblog', None)
    self.display["user"] = user = self.get_author_user()
    offset = int(self.breadcrumbs["modifier"]) if self.breadcrumbs["modifier"] else 1
    offset -= 1
    begin  = self.constants['page_size'] * offset

    dashboard_objects = [ self.models.content_remote(**content) if content['post_id'] else self.models.content(**content) \
          for content in db.dashboard_feed(user.username, begin, self.constants['page_size']) ]
    self.display['combined_feed'] = [ self.ui["modules"].RemoteContent(content) if content.post_id else self.ui["modules"].Content(content) \
          for content in dashboard_objects ]

    if self.display['combined_feed']:
      self.display['combined_feed'].sort(key=lambda x: x.date_created, reverse=True)

    if (not self.display['combined_feed'] or self.display['combined_feed'] == 0) \
        and self.request.headers.get("X-Requested-With") == "XMLHttpRequest":
      raise tornado.web.HTTPError(404)

    self.display['followers'] = self.models.users_remote.get(local_username=user.username, follower=1)[:]
    self.display['following'] = self.models.users_remote.get(local_username=user.username, following=1)[:]

    self.display["offset"] = offset + 1

    if self.request.headers.get("X-Requested-With") == "XMLHttpRequest":
      self.prevent_caching()
      self.write(self.ui["modules"].ContentView(self.display["combined_feed"]))
    else:
      self.fill_template("dashboard.html")
