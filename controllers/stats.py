import re

import tornado.web
from base import BaseHandler
from logic import content as content_logic
from logic import url_factory

class StatsHandler(BaseHandler):
  def get(self):
    increase_count(self)

    # ok!
    self.set_status(204)

class StatsStaticHandler(tornado.web.StaticFileHandler, BaseHandler):
  def get(self):
    BaseHandler.initialize(self)

    increase_count(self)

    tornado.web.StaticFileHandler.get(self, 'img/pixel.gif')

def increase_count(handler):
  is_robot = content_logic.is_viewed_by_robot(handler)
  if is_robot:
    return

  url = handler.get_argument('url', '')
  if url:
    content_url = url_factory.load_basic_parameters(handler, url=url)

    with handler.application.settings["db_lock"]:
      content = handler.models.content.get(username=content_url["profile"], section=content_url["section"], name=content_url["name"])[0]

      if content:
        if not handler.is_owner_viewing(content.username):
          content.count = content.count + 1

          content.save()
