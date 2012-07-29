import urllib

import tornado.web
from base import BaseHandler
from models import db

class SearchHandler(BaseHandler):
  def get(self):
    query = self.breadcrumbs["name"]

    content_owner = self.models.users.get(
        username=self.breadcrumbs["profile"])[0]

    if not content_owner:
      content_owner = self.models.users.get(1)
      self.breadcrumbs["profile"] = content_owner.username

    offset = (int(self.breadcrumbs["modifier"]) if
        self.breadcrumbs["modifier"] else 1)
    offset -= 1
    begin  = self.constants['page_size'] * offset

    if query:
      if (content_owner.adult_content
          and self.get_cookie("adult_content") != "1" and not
          self.is_owner_viewing(self.breadcrumbs["profile"])):
        self.fill_template("adult_content.html")
        return

      query = urllib.unquote_plus(query)
      resultsQuery = db.search(profile=self.breadcrumbs["profile"],
          query=query, begin=begin, page_size=self.constants['page_size'])
      results = [self.models.content(**result) for result in resultsQuery]
    else:
      results = []

    self.display["page"] = offset + 1
    self.display["page_size"] = self.constants['page_size']
    self.display["content_owner"] = content_owner
    self.display["query"] = query
    self.display["results"] = results
    self.fill_template("search.html")
