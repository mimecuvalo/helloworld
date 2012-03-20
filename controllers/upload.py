import json
import os
import os.path

from base import BaseHandler
from logic import media
from logic import url_factory

class UploadHandler(BaseHandler):
  def get(self):
    if not self.authenticate(author=True):
      return

    self.get_common_parameters()

    self.prevent_caching()
    if not os.path.exists(self.tmp_path):
      self.set_status(404)

  def post(self):
    if not self.authenticate(author=True):
      return

    self.get_common_parameters()

    uploaded_file = self.request.files['file'][0]
    self.media_section = url_factory.clean_filename(self.get_argument('section'))
    if self.media_section.startswith(self.resource_url()):
      self.media_section = self.media_section[len(self.resource_url()) + 1:]
    self.parent_directory = self.resource_directory(self.media_section)
    self.parent_url = self.resource_url(self.media_section)
    self.full_path = media.get_unique_name(os.path.join(self.parent_directory, self.base_leafname))

    if not os.path.isdir(self.parent_directory):
      os.makedirs(self.parent_directory)

    if self.chunked_upload:
      f = open(self.tmp_path, 'w')
      f.write(uploaded_file['body'])
      f.close()

      total_chunks_uploaded = 0
      for f in os.listdir(self.tmp_dir):
        if f.startswith(self.base_leafname):
          total_chunks_uploaded += 1

      if total_chunks_uploaded == max(self.total_size / self.chunk_size, 1):
        final_file = open(self.full_path, 'w')
        for f in os.listdir(self.tmp_dir):
          if f.startswith(self.base_leafname):
            chunk_path = os.path.join(self.tmp_dir, f)
            chunk_file = open(chunk_path, 'r')
            final_file.write(chunk_file.read())
            chunk_file.close()
            os.unlink(chunk_path)
        final_file.close()

        original_size_url, url, thumb_url = media.save_locally(self.parent_url, self.full_path, None, skip_write=True)
      else:
        return
    else:
      original_size_url, url, thumb_url = media.save_locally(self.parent_url, self.full_path, uploaded_file['body'])

    media_html = media.generate_full_html(self, url, original_size_url)
    self.write(json.dumps({ 'original_size_url': original_size_url, \
                            'url': url, \
                            'thumb_url': thumb_url, \
                            'html': media_html, }))

  def get_common_parameters(self):
    self.chunked_upload = True
    if not self.get_argument('resumableChunkSize', None):
      self.base_leafname = self.request.files['file'][0]['filename']
      self.chunked_upload = False
      return

    self.chunk_number = url_factory.clean_filename(self.get_argument('resumableChunkNumber'))
    self.chunk_size = int(self.get_argument('resumableChunkSize'))
    self.total_size = int(self.get_argument('resumableTotalSize'))
    self.identifier = self.get_argument('resumableIdentifier')
    self.filename = url_factory.clean_filename(self.get_argument('resumableFilename'))

    self.base_leafname = os.path.basename(self.filename)
    self.leafname = self.base_leafname + '_' + self.chunk_number.zfill(4)
    self.private_path = os.path.join(self.application.settings["private_path"], self.get_author_username())
    self.tmp_dir = os.path.join(self.private_path, 'tmp')
    self.tmp_path = os.path.join(self.tmp_dir, self.leafname)

    if not os.path.isdir(self.tmp_dir):
      os.makedirs(self.tmp_dir)
