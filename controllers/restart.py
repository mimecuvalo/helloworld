import os

from base import BaseHandler

class RestartHandler(BaseHandler):
  def get(self):
    if not self.authenticate(superuser=True):
      return

    os.system('touch ' + self.application.settings["restart_path"])
    self.redirect(self.get_argument("next"))
