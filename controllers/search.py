import urllib

import tornado.web
from base import BaseHandler
from models import db

class SearchHandler(BaseHandler):
  def get(self):
    query = self.get_argument('q', "")

    content_owner = self.models.users.get(username=self.breadcrumbs["profile"])[0]

    if not content_owner:
      content_owner = self.models.users.get(1)
      self.breadcrumbs["profile"] = content_owner.username

    if query:
      if content_owner.adult_content \
          and self.get_cookie("adult_content") != "1" and not self.is_owner_viewing(self.breadcrumbs["profile"]):
        self.fill_template("adult_content.html")
        return

      query = urllib.unquote_plus(query)
      resultsQuery = db.search(profile=self.breadcrumbs["profile"], query=query)
      results = [self.models.content(**result) for result in resultsQuery]
    else:
      results = []

    self.display["content_owner"] = content_owner
    self.display["query"] = query
    self.display["results"] = results
    self.fill_template("search.html")
