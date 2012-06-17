import tornado.web
from base import BaseHandler
import datetime

class PrivateResourceHandler(tornado.web.StaticFileHandler, BaseHandler):
  def get(self, path):
    BaseHandler.initialize(self)

    try:
      if not self.authenticate(private_resource=self.request.uri,
          auto_login=False):
        # 401, need to login
        self.set_status(401)
        self.prevent_caching()
        tornado.web.StaticFileHandler.get(self, "401.png")
        return
    except tornado.web.HTTPError as ex:
      # 403, forbidden
      self.set_status(403)
      self.prevent_caching()
      tornado.web.StaticFileHandler.get(self, "403.png")
      return

    # ok!
    tornado.web.StaticFileHandler.get(self, path)
