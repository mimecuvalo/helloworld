import json

import tornado.web

from base import BaseHandler
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

    self.display["user"] = user = self.get_author_user()
    self.display["is_dashboard"] = True
    self.display["is_owner_viewing"] = True    

    if self.get_argument('get_counts', None):
      self.get_latest_counts(user)
      result = { 'total_count' : self.display['total_count'],
                 'favorites_count' : self.display['favorites_count'],
                 'comments_count' : self.display['comments_count'],
                 'spam_count' : self.display['spam_count'], }
      for source in self.constants['external_sources']:
        result[source + '_count'] = self.display[source + '_count']

      for profile in self.display['following']:
        result[profile.profile_url] = profile.unread_entries

      self.prevent_caching()
      self.write(json.dumps(result))
      return

    self.display["own_feed"] = int(self.get_argument('own_feed', 0))
    self.display["local_entry"] = self.get_argument('local_entry', None)
    self.display["remote_entry"] = self.get_argument('remote_entry', None)
    self.display["sort_type"] = self.get_argument('sort_type', None)
    self.display["sort_type"] = ('oldest' if
        self.display["sort_type"] == 'oldest' else '')
    if self.get_argument('list_mode', None) != None:
      self.display["list_mode"] = int(self.get_argument('list_mode', 0))
    else:
      self.display["list_mode"] = (int(self.get_cookie("list_mode")) if
          self.get_cookie("list_mode") != None else 0)
    if self.get_argument('read_all_mode', None) != None:
      self.display["read_all_mode"] = \
          int(self.get_argument('read_all_mode', 0))
    else:
      self.display["read_all_mode"] = (int(self.get_cookie("read_all_mode")) if
          self.get_cookie("read_all_mode") != None else 0)
    self.display["read_spam"] = int(self.get_argument('read_spam', 0))
    self.display["read_favorites"] = \
        int(self.get_argument('read_favorites', 0))
    self.display["read_comments"] = int(self.get_argument('read_comments', 0))
    for source in self.constants['external_sources']:
      self.display["read_" + source] = \
          int(self.get_argument('read_' + source, 0))
      self.display["external_cookie_" + source] = \
          self.get_cookie("external_" + source)
    self.display["from_local_id"] = self.get_argument('from_local_id', None)
    self.display["from_remote_id"] = self.get_argument('from_remote_id', None)
    self.display["q"] = self.get_argument('q', None)
    self.display["specific_feed"] = self.get_argument('specific_feed', None)
    offset = (int(self.breadcrumbs["modifier"]) if
        self.breadcrumbs["modifier"] else 1)
    offset -= 1
    begin  = self.constants['page_size'] * offset
    end  = self.constants['page_size'] * offset + self.constants['page_size']

    self.display['has_external'] = False
    for source in self.constants['external_sources']:
      if getattr(user, source):
        self.display['has_external'] = True
        break

    if self.display["specific_feed"]:
      specific_user = self.models.users_remote.get(
          local_username=user.username,
          profile_url=self.display["specific_feed"])[0]
      if self.display["sort_type"] != specific_user.sort_type:
        specific_user.sort_type = self.display["sort_type"]
        specific_user.save()

    external = None
    for source in self.constants['external_sources']:
      if self.display["read_" + source]:
        external = source
        break

    local_date = None
    remote_date = None
    if self.display["from_local_id"]:
      local_date = self.models.content.get(
          self.display["from_local_id"]).date_created
    if self.display["from_remote_id"]:
      remote_date = self.models.content_remote.get(
          self.display["from_remote_id"]).date_created

    dashboard_objects = \
        [ self.models.content_remote(**content) \
          if content['post_id'] else \
             self.models.content(**content) \
          for content in db.dashboard_feed(
              user.username, begin, self.constants['page_size'],
              self.display["sort_type"], self.display["read_all_mode"], \
              self.display["specific_feed"], self.display["own_feed"], \
              self.display["local_entry"], self.display["remote_entry"], \
              self.display["read_spam"], self.display["read_favorites"],
              self.display["read_comments"], external, \
              self.display["q"], local_date, remote_date) ]

    self.display['combined_feed'] = \
        [ self.ui["modules"].RemoteContent(content) \
          if content.post_id else \
            self.ui["modules"].Content(content, sanitize=True) \
          for content in dashboard_objects ]

    if self.display['combined_feed']:
      self.display['combined_feed'].sort(key=lambda x: x.date_created,
          reverse=(self.display["sort_type"] != 'oldest'))

    if ((not self.display['combined_feed'] or
        self.display['combined_feed'] == 0) and
        self.request.headers.get("X-Requested-With") == "XMLHttpRequest"):
      raise tornado.web.HTTPError(404)

    self.display["offset"] = offset + 1

    if self.request.headers.get("X-Requested-With") == "XMLHttpRequest":
      self.prevent_caching()
      self.write(self.ui["modules"].ContentView(self.display["combined_feed"],
          list_mode=self.display["list_mode"]))
      return

    self.get_latest_counts(user)

    self.fill_template("dashboard.html")

  def get_latest_counts(self, user):
    self.display['followers'] = self.models.users_remote.get(
        local_username=user.username, follower=1).order_by('username')[:]
    self.display['following'] = self.models.users_remote.get(
        local_username=user.username, following=1).order_by(
        'order,username')[:]

    total_count = 0
    for profile in self.display['following']:
      profile_count = self.models.content_remote.get(to_username=user.username,
          from_user=profile.profile_url, type='post', read=0, is_spam=0,
          deleted=0).count()
      profile.unread_entries = profile_count
      total_count += profile_count

    self.display['favorites_count'] = self.models.content_remote.get(
        to_username=user.username, favorited=True, deleted=False).count()
    self.display['comments_count']  = self.models.content_remote.get(
        to_username=user.username, type='comment', deleted=False).count()
    self.display['spam_count']      = self.models.content_remote.get(
        to_username=user.username, is_spam=True, deleted=False).count()

    for source in self.constants['external_sources']:
      self.display[source + '_count']  = self.models.content_remote.get(
          to_username=user.username, type=source, read=0, is_spam=0,
          deleted=0).count()
      total_count += self.display[source + '_count']

    self.display['total_count']     = total_count
