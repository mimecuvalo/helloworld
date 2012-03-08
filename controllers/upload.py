import os
import os.path
import re
import urllib2

import tornado.web
from base import BaseHandler
from logic import content_remote
from logic import media
from logic import url_factory

class UploadHandler(BaseHandler):
  def post(self):
    if not self.authenticate(author=True):
      return

    remote_file = self.get_argument('hw-media-remote')

    self.display['thumb'] = ''
    self.display['title'] = self.get_argument('hw-media-title', '')

    if remote_file:
      self.display['success'] = True

      if re.search(r'^\s*<', remote_file):
        self.display['html'] = remote_file    # embed
      else:
        self.display['html'] = self.process_html(True, remote_file)
    else:
      uploaded_file = self.request.files['hw-media-local'][0]

      self.display['success'] = True
      self.display['html'] = self.process_html(False, uploaded_file['filename'])

    self.set_status(201)
    self.fill_template("upload.html")

  def process_html(self, is_remote, filename):
    filename = url_factory.clean_filename(filename)

    media_type = media.detect_media_type(filename)

    full_caption = self.get_argument('hw-media-caption', '')
    alt_text = self.get_argument('hw-media-caption', '')
    source = self.get_argument('hw-media-source', '')
    tags = self.get_argument('hw-media-tags', '')
    media_section = url_factory.clean_filename(self.get_argument('hw-media-section'))
    media_album = url_factory.clean_filename(self.get_argument('hw-media-album', ''))

    parent_directory = self.resource_directory(media_section, media_album)
    parent_url = self.resource_url(media_section, media_album)
    leafname = os.path.basename(filename)
    full_path = os.path.join(parent_directory, leafname)
    url_factory.check_legit_filename(full_path)

    if not os.path.isdir(parent_directory):
      os.makedirs(parent_directory)

    if is_remote:
      remote_url = filename
      url = filename

      if not media_type and url.find('http://') == 0:
        remote_title, remote_thumb, remote_html = content_remote.get_remote_title_and_thumb(url)
        if remote_html:
          return remote_html

        if remote_thumb:
          return '<a href="' + url + '" title="' + remote_title + '"><img src="' + remote_thumb + '"></a>'

        return '<a href="' + url + '">' + url + '</a>'
      else:
        if not source:
          source = url

        response = urllib2.urlopen(url)
        original_size_url, url, thumb_url = media.save_locally(parent_url, full_path, response.read())
        self.display['thumb'] = thumb_url
    else:
      uploaded_file = self.request.files['hw-media-local'][0]
      original_size_url, url, thumb_url = media.save_locally(parent_url, full_path, uploaded_file['body'])
      self.display['thumb'] = thumb_url

    if source:
      if full_caption:
        full_caption += ' &mdash; '
      full_caption += self.locale.translate('source:') + ' '
      if source.find('http://') == 0:
        full_caption += '<a href="' + source + '">' + source + '</a>'
      else:
        full_caption += source

      if alt_text:
        alt_text += ' &mdash; '
      alt_text += self.locale.translate('source:') + ' ' + source

    if tags:
      if full_caption:
        full_caption += ' &mdash; '
      full_caption += self.locale.translate('tags:') + ' '
      full_caption += tags

    if is_remote:
      original_size_url = remote_url

    return media.generate_full_html(self, url, original_size_url, full_caption, alt_text)
