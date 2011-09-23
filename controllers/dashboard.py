from base import BaseHandler
from logic import users

import tornado.web

class DashboardHandler(BaseHandler):
  def get(self):
    if not self.authenticate(author=True):
      return

    self.display["initial_media"] = self.get_argument('reblog', None)
    self.display["user"] = user = self.get_author_user()
    offset = int(self.breadcrumbs["modifier"]) if self.breadcrumbs["modifier"] else 1
    offset -= 1
    begin  = self.constants['page_size'] * offset
    end    = self.constants['page_size'] * offset + self.constants['page_size']

    content_options = {
      'username': user.username,
      'redirect': 0,
      'section !=': 'comments',
    }
    self.display["feed"] = [ self.ui["modules"].Content(content) \
        for content in self.models.content.get(**content_options).order_by('date_created', 'DESC')[begin:end] ]

    self.display['followers'] = self.models.users_remote.get(local_username=user.username, follower=1)[:]
    self.display['following'] = self.models.users_remote.get(local_username=user.username, following=1)[:]

    self.display['content_remote'] = [ self.ui["modules"].RemoteContent(content) \
        for content in self.models.content_remote.get( \
            to_username=user.username, type='post', is_spam=False, deleted=False).order_by('date_created', 'DESC')[begin:end] ]

    self.display['favorited'] = [ self.ui["modules"].RemoteContent(content) \
        for content in self.models.content_remote.get( \
            to_username=user.username, type='favorite', is_spam=False).order_by('date_created', 'DESC')[begin:end] ]

    self.display['comments'] = [ self.ui["modules"].RemoteContent(content) \
        for content in self.models.content_remote.get( \
            to_username=user.username, type='comment', is_spam=False, deleted=False).order_by('date_created', 'DESC')[begin:end] ]

    self.display['spam'] = [ self.ui["modules"].RemoteContent(content) \
        for content in self.models.content_remote.get( \
            to_username=user.username, type='spam', is_spam=False).order_by('date_created', 'DESC')[begin:end] ]

    self.display['combined_feed'] = self.display["feed"] \
        + self.display['comments'] + self.display["spam"] \
        + self.display['favorited'] + self.display['content_remote']

    if self.display['combined_feed']:
      self.display['combined_feed'].sort(key=lambda x: x.date_created, reverse=True)

    if (not self.display['combined_feed'] or self.display['combined_feed'] == 0) \
        and self.request.headers.get("X-Requested-With") == "XMLHttpRequest":
      raise tornado.web.HTTPError(404)

    self.display["offset"] = offset + 1

    if self.request.headers.get("X-Requested-With") == "XMLHttpRequest":
      self.prevent_caching()
      self.write(self.ui["modules"].ContentView(self.display["combined_feed"]))
    else:
      self.fill_template("dashboard.html")
