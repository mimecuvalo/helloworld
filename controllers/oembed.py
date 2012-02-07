from base import BaseHandler
from logic import url_factory
from logic import content as content_logic

class OembedHandler(BaseHandler):
  def get(self):
    url = self.get_argument("url")
    content_url = url_factory.load_basic_parameters(self, url=url)
    self.display["content"] = content = self.models.content.get(username=content_url["profile"],
                                                      section=content_url["section"],
                                                      name=content_url["name"])[0]
    content_owner = self.models.users.get(username=content.username)[0]
    self.display['content_owner'] = content_owner
    self.display['content_thumb'] = content_logic.get_thumbnail(self, content)
    self.display['thumb_width']   = content_logic.THUMB_WIDTH
    self.display['thumb_height']  = content_logic.THUMB_HEIGHT

    self.set_header("Content-Type", "text/xml")
    self.fill_template("oembed.html")
