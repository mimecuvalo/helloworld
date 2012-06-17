import hashlib

from base import BaseHandler

import tornado.web

class FoafHandler(BaseHandler):
  def get(self):
    user = self.models.users.get(username=self.breadcrumbs["profile"])[0]

    if not user:
      raise tornado.web.HTTPError(404)

    self.display["user"] = user

    self.display['mbox_sha1sum'] = hashlib.sha1(
        'mailto:' + user.email).hexdigest()
    self.display['followers'] = self.models.users_remote.get(
        local_username=user.username, follower=1)[:]
    self.display['following'] = self.models.users_remote.get(
        local_username=user.username, following=1)[:]

    self.set_header("Content-Type", "application/rdf+xml")
    self.fill_template("foaf.html")
