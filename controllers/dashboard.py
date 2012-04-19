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

    if self.get_argument('get_counts', None):
      self.get_latest_counts(user)
      result = { 'total_count' : self.display['total_count'],
                 'favorites_count' : self.display['favorites_count'],
                 'comments_count' : self.display['comments_count'],
                 'spam_count' : self.display['spam_count'],
                 'twitter_count' : self.display['twitter_count'],
                 'facebook_count' : self.display['facebook_count'],
                 'google_count' : self.display['google_count'], }
      for profile in self.display['following']:
        result[profile.profile_url] = profile.unread_entries
      self.prevent_caching()
      self.write(json.dumps(result))
      return

    self.display["own_feed"] = int(self.get_argument('own_feed', 0))
    self.display["local_entry"] = self.get_argument('local_entry', None)
    self.display["remote_entry"] = self.get_argument('remote_entry', None)
    self.display["sort_type"] = self.get_argument('sort_type', None)
    self.display["sort_type"] = 'oldest' if self.display["sort_type"] == 'oldest' else ''
    if self.get_argument('list_mode', None) != None:
      self.display["list_mode"] = int(self.get_argument('list_mode', 0))
    else:
      self.display["list_mode"] = int(self.get_cookie("list_mode")) if self.get_cookie("list_mode") != None else 0
    if self.get_argument('read_all_mode', None) != None:
      self.display["read_all_mode"] = int(self.get_argument('read_all_mode', 0))
    else:
      self.display["read_all_mode"] = int(self.get_cookie("read_all_mode")) if self.get_cookie("read_all_mode") != None else 0
    self.display["read_spam"] = int(self.get_argument('read_spam', 0))
    self.display["read_favorites"] = int(self.get_argument('read_favorites', 0))
    self.display["read_comments"] = int(self.get_argument('read_comments', 0))
    self.display["read_twitter"] = int(self.get_argument('read_twitter', 0))
    self.display["read_facebook"] = int(self.get_argument('read_facebook', 0))
    self.display["read_google"] = int(self.get_argument('read_google', 0))
    self.display["from_local_id"] = self.get_argument('from_local_id', None)
    self.display["from_remote_id"] = self.get_argument('from_remote_id', None)
    self.display["q"] = self.get_argument('q', None)
    self.display["specific_feed"] = self.get_argument('specific_feed', None)
    offset = int(self.breadcrumbs["modifier"]) if self.breadcrumbs["modifier"] else 1
    offset -= 1
    begin  = self.constants['page_size'] * offset
    end  = self.constants['page_size'] * offset + self.constants['page_size']

    if self.display["specific_feed"]:
      specific_user = self.models.users_remote.get(local_username=user.username, profile_url=self.display["specific_feed"])[0]
      if self.display["sort_type"] != specific_user.sort_type:
        specific_user.sort_type = self.display["sort_type"]
        specific_user.save()

    dashboard_objects = \
        [ self.models.content_remote(**content) \
          if content['post_id'] else \
             self.models.content(**content) \
          for content in db.dashboard_feed(user.username, begin, self.constants['page_size'], self.display["sort_type"], self.display["read_all_mode"], \
                                           self.display["specific_feed"], self.display["own_feed"], \
                                           self.display["local_entry"], self.display["remote_entry"], \
                                           self.display["read_spam"], self.display["read_favorites"], self.display["read_comments"], \
                                           self.display["read_twitter"], self.display["read_facebook"], self.display["read_google"], \
                                           self.display["q"], self.display["from_local_id"], self.display["from_remote_id"]) ]

    self.display['combined_feed'] = \
        [ self.ui["modules"].RemoteContent(content) \
          if content.post_id else \
            self.ui["modules"].Content(content, sanitize=True) \
          for content in dashboard_objects ]

    if self.display['combined_feed']:
      self.display['combined_feed'].sort(key=lambda x: x.date_created, reverse=(self.display["sort_type"] != 'oldest'))

    if (not self.display['combined_feed'] or self.display['combined_feed'] == 0) \
        and self.request.headers.get("X-Requested-With") == "XMLHttpRequest":
      raise tornado.web.HTTPError(404)

    self.display["offset"] = offset + 1

    if self.request.headers.get("X-Requested-With") == "XMLHttpRequest":
      self.prevent_caching()
      self.write(self.ui["modules"].ContentView(self.display["combined_feed"], list_mode=self.display["list_mode"]))
      return

    self.get_latest_counts(user)

    self.fill_template("dashboard.html")

  def get_latest_counts(self, user):
    self.display['followers'] = self.models.users_remote.get(local_username=user.username, follower=1).order_by('username')[:]
    self.display['following'] = self.models.users_remote.get(local_username=user.username, following=1).order_by('order,username')[:]

    total_count = 0
    for profile in self.display['following']:
      profile_count = self.models.content_remote.get(to_username=user.username, from_user=profile.profile_url, type='post', read=0, is_spam=0, deleted=0).count()
      profile.unread_entries = profile_count
      total_count += profile_count

    self.display['favorites_count'] = self.models.content_remote.get(to_username=user.username, favorited=True, deleted=False).count()
    self.display['comments_count']  = self.models.content_remote.get(to_username=user.username, type='comment', deleted=False).count()
    self.display['spam_count']      = self.models.content_remote.get(to_username=user.username, is_spam=True, deleted=False).count()

    self.display['twitter_count']  = self.models.content_remote.get(to_username=user.username, type='twitter', read=0, is_spam=0, deleted=0).count()
    self.display['facebook_count'] = self.models.content_remote.get(to_username=user.username, type='facebook', read=0, is_spam=0, deleted=0).count()
    self.display['google_count']   = self.models.content_remote.get(to_username=user.username, type='google', read=0, is_spam=0, deleted=0).count()

    total_count += self.display['twitter_count'] + self.display['facebook_count'] + self.display['google_count']
    self.display['total_count']     = total_count
