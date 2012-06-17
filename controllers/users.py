import os
import shutil

import tornado.escape

from base import BaseHandler
from logic import users
from logic import url_factory

class UsersHandler(BaseHandler):
  def get(self):
    if not self.authenticate(superuser=True):
      return

    if self.get_argument('login_as', None):
      content_url = url_factory.load_basic_parameters(self, prefix="/users")
      user = self.models.users.get(username=content_url["profile"])[0]
      response = { 'email': user.email }
      self.set_secure_cookie("user", tornado.escape.json_encode(response),
          path=self.base_path, HttpOnly=True)
      self.redirect(self.nav_url(username=content_url["profile"]))
      return

    self.display["user"] = self.get_author_user()
    self.display["users"] = self.models.users.get()

    self.fill_template("users.html")

  def post(self):
    if not self.authenticate(superuser=True):
      return

    content_url = url_factory.load_basic_parameters(self, prefix="/users")

    user = users.create_user(self, content_url["profile"],
        self.get_argument('email'))

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
    user.email     = self.get_argument('email')
    user.name      = self.get_argument('name', '')
    user.author    = int(self.get_argument('author'))
    user.superuser = int(self.get_argument('superuser'))
    user.hostname  = self.get_argument('hostname', '')

    if user.superuser:
      user.author = True

    user.save()
