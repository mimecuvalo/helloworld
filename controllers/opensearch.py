from base import BaseHandler

class OpenSearchHandler(BaseHandler):
  def get(self):
    user = self.models.users.get(username=self.breadcrumbs["profile"])[0]

    if not user:
      raise tornado.web.HTTPError(404)

    self.display["user"] = user

    self.set_header("Content-Type", "application/opensearchdescription+xml")
    self.fill_template("opensearch.html")
