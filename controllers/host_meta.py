from base import BaseHandler

class HostMetaHandler(BaseHandler):
  def get(self):
    resource = self.get_argument("resource", "")
    if resource:
      self.redirect(self.nav_url(host=True, section="webfinger",
          q=resource))
      return

    self.set_header("Content-Type", "application/xrd+xml")
    self.fill_template("host_meta.html")
