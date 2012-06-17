import os.path
import tempfile
import zipfile

from autumn.db.query import Query
import tornado.web

from base import BaseHandler
from logic import url_factory

class DataLiberationHandler(BaseHandler):
  def get(self):
    if not self.authenticate(author=True):
      return

    if self.get_argument('prepare', ''):
      self.prepare_file()
      self.set_status(204)
      return

    self.display["user"] = self.get_author_user()

    self.fill_template("data_liberation.html")

  def data_liberation_path(self):
    leaf_name = self.get_author_username()

    leaf_name = "helloworld_" + leaf_name + "_data_liberation.zip"

    return os.path.join(tempfile.gettempdir(), leaf_name)

  def prepare_file(self):
    zf = zipfile.ZipFile(self.data_liberation_path(), 'w')
    username = self.get_author_username()

    user_data = Query.sql("""SELECT * FROM `users`
                             WHERE `username` = %s""",
                             (username))

    content_data = Query.sql("""SELECT * FROM `content`
                                WHERE `username` = %s""",
                                (username))

    # sql data
    zf.writestr('user_data', repr(user_data))
    zf.writestr('content_data', repr(content_data))

    # files
    files = os.walk(url_factory.resource_directory(self))
    for f in files:
      for filename in f[2]:
        path = os.path.join(f[0], filename)
        arcname = path[len(
            url_factory.resource_directory(self)) - len(username):]
        zf.write(path, arcname)

    zf.close()

class DataLiberationDownloadHandler(tornado.web.StaticFileHandler,
    DataLiberationHandler):
  def get(self):
    BaseHandler.initialize(self)

    if not self.authenticate(author=True):
      return

    path = self.data_liberation_path()
    tornado.web.StaticFileHandler.get(self, path)
