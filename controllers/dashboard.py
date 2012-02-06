import tornado.web

from base import BaseHandler
from logic import remote_content
from logic import users
from models import db

class DashboardHandler(BaseHandler):
  def get(self):
    if not self.authenticate(author=True):
      return

    # redirect users that come here via /admin to proper /dashboard link
    if self.breadcrumbs["name"] == 'admin':
      self.redirect(self.nav_url(section='dashboard'), permanent=True)
      return

    self.display["initial_media"] = self.get_argument('reblog', None)
    self.display["own_feed"] = int(self.get_argument('own_feed', 0))
    if self.get_argument('list_mode', None) != None:
      self.display["list_mode"] = int(self.get_argument('list_mode', 0))
    else:
      self.display["list_mode"] = int(self.get_cookie("list_mode")) if self.get_cookie("list_mode") != None else 0
    self.display["read_spam"] = int(self.get_argument('read_spam', 0))
    self.display["specific_feed"] = self.get_argument('specific_feed', None)
    self.display["user"] = user = self.get_author_user()
    offset = int(self.breadcrumbs["modifier"]) if self.breadcrumbs["modifier"] else 1
    offset -= 1
    begin  = self.constants['page_size'] * offset
    end  = self.constants['page_size'] * offset + self.constants['page_size']

    if self.display["read_spam"]:
      self.display["list_mode"] = 0
      dashboard_objects = self.models.content_remote.get(to_username=user.username, is_spam=True)[begin:end]
    else:
      dashboard_objects = \
          [ self.models.content_remote(**content) \
            if content['post_id'] else \
                self.models.content(**content) \
            for content in db.dashboard_feed(user.username, begin, self.constants['page_size'], \
                                             self.display["specific_feed"], self.display["own_feed"]) ]

    self.display['combined_feed'] = \
        [ self.ui["modules"].RemoteContent(content) \
          if content.post_id else \
            self.ui["modules"].Content(content, sanitize=True) \
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
      self.write(self.ui["modules"].ContentView(self.display["combined_feed"], list_mode=self.display["list_mode"]))
    else:
      self.fill_template("dashboard.html")
