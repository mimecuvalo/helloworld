import os
import os.path
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
      self.display["uploaded_file"] = None
    self.display["embedded"] = self.get_argument('embedded', '')
    self.display["standalone"] = self.get_argument('standalone', '')
    self.display["initial_directory"] = self.get_argument('hw-media-directory', '')

    if self.display["standalone"] or self.display["embedded"]:
      self.fill_template("media_standalone.html")
    else:
      self.fill_template("media.html")  # disabled for now

  def post(self):
    parent_directory = os.path.join(self.resource_directory(), url_factory.clean_filename(self.get_argument('hw-media-directory', '')))
    uploaded_file = self.request.files['hw-media-uploaded-file'][0]
    full_path = os.path.join(parent_directory, uploaded_file['filename'])

    leafname = os.path.basename(full_path)
    if leafname in ('crossdomain.xml', 'clientaccesspolicy.xml', '.htaccess', '.htpasswd'):
      raise tornado.web.HTTPError(400, "i call shenanigans")

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

    self.display["uploaded_file"] = self.resource_url(filename=full_path)
    self.get()

  def preview(self):
    uri = self.get_argument('preview')
    media_type = media.detect_media_type(uri)
    html = media.generate_html(self, uri)
    if media_type in ('video', 'audio'):
      html += '<br>'
      if media_type == 'video':
        html += self.locale.translate('download video:') + ' '
      else:
        html += self.locale.translate('download audio:') + ' '
      html += '<a href="' + uri + '" target="_blank">' + uri[uri.rfind('/') + 1:] + '</a>'

    self.write(html)
