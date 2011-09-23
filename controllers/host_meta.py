from base import BaseHandler

class HostMetaHandler(BaseHandler):
  def get(self):
    self.set_header("Content-Type", "application/xrd+xml")
    self.fill_template("host_meta.html")
