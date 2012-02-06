import os
import shutil

from base import BaseHandler
from logic import users
from logic import url_factory

class UsersHandler(BaseHandler):
  def get(self):
    if not self.authenticate(superuser=True):
      return

    self.display["user"] = self.get_author_user()
    self.display["users"] = self.models.users.get()

    self.fill_template("users.html")

  def post(self):
    if not self.authenticate(superuser=True):
      return

    content_url = url_factory.load_basic_parameters(self, prefix="/users")

    user = users.create_user(self, content_url["profile"], self.get_argument('oauth'))

    self.save_user(user)
    self.set_status(204)

  def put(self):
    if not self.authenticate(superuser=True):
      return

    content_url = url_factory.load_basic_parameters(self, prefix="/users")

    user = self.models.users.get(username=content_url["profile"])[0]

    if not user:
      raise tornado.web.HTTPError(404)

    self.save_user(user)
    self.set_status(204)

  def delete(self):
    content_url = url_factory.load_basic_parameters(self, prefix="/users")

    if content_url["profile"] != self.current_user["username"]:
      if not self.authenticate(superuser=True):
        return
    else:
      if not self.authenticate(author=True):
        return

    user = self.models.users.get(username=content_url["profile"])[0]

    if not user:
      raise tornado.web.HTTPError(404)

    user.delete()

    shutil.rmtree(os.path.join(self.application.settings["private_path"],
                               content_url["profile"]))

    shutil.rmtree(os.path.join(self.application.settings["resource_path"],
                               content_url["profile"]))

    self.set_status(204)

  def save_user(self, user):
    user.oauth     = self.get_argument('oauth')
    user.name      = self.get_argument('name', '')
    user.author    = int(self.get_argument('author'))
    user.superuser = int(self.get_argument('superuser'))

    if user.superuser:
      user.author = True

    user.save()
