import json
import os
import os.path
import shutil
import zipfile

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

    parent_directory = self.resource_directory()
    self.display["files"] = os.walk(parent_directory)
    self.display["initial_section"] = self.get_argument('initial_section', None)

    self.display["basename"] = os.path.basename
    self.display["dirname"] = os.path.dirname
    self.display["join"] = os.path.join
    if not self.display.has_key('uploaded_file'):
      self.display["uploaded_file"] = self.get_argument('uploaded_file', None)
    self.display["embedded"] = self.get_argument('embedded', '')
    self.display["standalone"] = self.get_argument('standalone', '')
    self.display["initial_directory"] = self.get_argument('hw-media-directory', '')

    if self.display["standalone"] or self.display["embedded"]:
      self.fill_template("media_standalone.html")
    else:
      self.fill_template("media.html")  # disabled for now

  def post(self):
    if not self.authenticate(author=True):
      return

    parent_leading_path = self.application.settings["resource_url"] + "/" + self.get_author_username()
    media_directory = url_factory.clean_filename(self.get_argument('hw-media-directory', '')).replace(parent_leading_path + '/', '')
    parent_directory = os.path.join(self.resource_directory(), media_directory)

    for uploaded_file in self.request.files['hw-media-uploaded-file']:
      full_path = os.path.join(parent_directory, uploaded_file['filename'])
      url_factory.check_legit_filename(full_path)

      if not os.path.isdir(parent_directory):
        os.makedirs(parent_directory)

      # check dupe
      counter = 1
      original_path = full_path
      while os.path.exists(full_path):
        split_path = os.path.splitext(original_path)
        full_path = split_path[0] + '_' + str(counter) + split_path[1]
        counter += 1

      f = open(full_path, 'w')
      f.write(uploaded_file['body'])
      f.close()

      if os.path.splitext(full_path)[1] == '.zip':
        z = zipfile.ZipFile(full_path)
        for f in z.namelist():
          if f.endswith('/'):
            os.makedirs(os.path.join(os.path.dirname(full_path), url_factory.clean_filename(f)))
          else:
            z.extract(url_factory.clean_filename(f), os.path.dirname(full_path))

      if not self.display.has_key('uploaded_file'):
        self.display["uploaded_file"] = self.resource_url(filename=full_path)

    self.get()

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
      filename = os.path.join(self.resource_directory(), f)

      if os.path.isdir(filename):
        shutil.rmtree(filename)
      else:
        os.remove(filename)
