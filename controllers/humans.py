import tornado.web

class HumansTxtHandler(tornado.web.StaticFileHandler):
  def set_extra_headers(self, path):
    self.set_header("Content-Type", "text/plain; charset=UTF-8")
