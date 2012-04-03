import json
import os
import os.path
import shutil

import tornado.web

from base import BaseHandler
from logic import media
from logic import url_factory

class MediaHandler(BaseHandler):
  def get(self):
    if not self.authenticate(author=True):
      return

    if self.get_argument('preview', ''):
      self.preview()
      return

    self.display["user"] = self.get_author_user()

    parent_directory = url_factory.resource_directory(self)
    self.display["files"] = os.walk(parent_directory)
    self.display["initial_section"] = None
    initial_section_check = self.get_argument('initial_section', None)
    if initial_section_check and os.path.exists(os.path.join(url_factory.resource_directory(self), initial_section_check)):
      self.display["initial_section"] = initial_section_check

    self.display["basename"] = os.path.basename
    self.display["dirname"] = os.path.dirname
    self.display["join"] = os.path.join

    if not self.display.has_key('uploaded_file'):
      self.display["uploaded_file"] = None
      uploaded_file_check = self.get_argument('uploaded_file', None)

      if uploaded_file_check:
        uploaded_file_check = url_factory.clean_filename(uploaded_file_check)
        uploaded_file_check = os.path.join(self.application.settings["base_path"], uploaded_file_check)

        if not uploaded_file_check.startswith(url_factory.resource_directory(self)):
          raise tornado.web.HTTPError(400, "i call shenanigans")

        if os.path.exists(uploaded_file_check):
          self.display["uploaded_file"] = uploaded_file_check.replace(self.application.settings["base_path"] + '/', '')
          self.display["initial_section"] = os.path.dirname(self.display["uploaded_file"])

    self.display["embedded"] = self.get_argument('embedded', '')

    if self.display["embedded"]:
      self.fill_template("media_standalone.html")
    else:
      self.fill_template("media.html")  # disabled for now

  def preview(self):  
    if not self.authenticate(author=True):
      return

    uri = self.get_argument('preview')
    media_type = media.detect_media_type(uri)
    html = media.generate_html(uri)
    if media_type in ('video', 'audio'):
      html += '<br>'
      if media_type == 'video':
        html += self.locale.translate('download video:') + ' '
      else:
        html += self.locale.translate('download audio:') + ' '
      html += '<a href="' + uri + '" target="_blank">' + uri[uri.rfind('/') + 1:] + '</a>'

    self.write(html)

  def delete(self):
    if not self.authenticate(author=True):
      return

    files = json.loads(self.get_argument('files'))

    parent_leading_path = self.application.settings["resource_url"] + "/" + self.get_author_username()

    for f in files:
      f = url_factory.clean_filename(f).replace(parent_leading_path + '/', '')
      filename = os.path.join(url_factory.resource_directory(self), f)

      if os.path.isdir(filename):
        shutil.rmtree(filename)
      else:
        os.remove(filename)
