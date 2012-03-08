import os
import os.path
import re
import urllib2
import urlparse
import xml.dom.minidom

from BeautifulSoup import BeautifulSoup
import Image
from PIL.ExifTags import TAGS

import tornado.escape
import tornado.web
from base import BaseHandler
from logic import content as content_logic
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
    leafname = os.path.basename(filename)
    full_path = os.path.join(parent_directory, leafname)

    if leafname in ('crossdomain.xml', 'clientaccesspolicy.xml', '.htaccess', '.htpasswd'):
      raise tornado.web.HTTPError(400, "i call shenanigans")

    if not os.path.isdir(parent_directory):
      os.makedirs(parent_directory)

    # check dupe
    full_path = self.get_unique_name(full_path)

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
        original_size_url, url = self.save_locally(media_type, full_path, response.read())
    else:
      uploaded_file = self.request.files['hw-media-local'][0]
      original_size_url, url = self.save_locally(media_type, full_path, uploaded_file['body'])

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

    media_html = '<figure>'
    if media_type == 'image':
      if is_remote:
        original_size_url = remote_url

      media_html += '<a href="' + original_size_url + '">'
      media_html += media.generate_html(self, url, alt_text=alt_text)
      media_html += '</a>'
    elif media_type in ('video', 'audio'):
      media_html += media.generate_html(self, url, alt_text=alt_text)
      if full_caption:
        full_caption += '<br />'
      if media_type == 'video':
        full_caption += self.locale.translate('download video:') + ' '
      else:
        full_caption += self.locale.translate('download audio:') + ' '
      full_caption += '<a href="' + url + '">' + url[url.rfind('/') + 1:] + '</a>'
    else:
      media_html += '<a href="' + url + '">' + url[url.rfind('/') + 1:] + '</a>'

    if full_caption:
      media_html += '<figcaption>' + full_caption + '</figcaption>'

    media_html += '</figure>'

    return media_html

  def save_locally(self, media_type, full_path, data):
    media_section = url_factory.clean_filename(self.get_argument('hw-media-section'))
    media_album = url_factory.clean_filename(self.get_argument('hw-media-album', ''))

    parent_url = self.resource_url(media_section, media_album)
    original_size_url = ''
    url = parent_url + os.path.split(full_path)[1]

    if media_type == 'image':
      split_path = os.path.split(full_path)
      thumb_dir = os.path.join(split_path[0], 'thumbs')
      original_size_dir = os.path.join(split_path[0], 'original')
      leaf_name = os.path.split(full_path)[1]

      if not os.path.isdir(thumb_dir):
        os.makedirs(thumb_dir)
      if not os.path.isdir(original_size_dir):
        os.makedirs(original_size_dir)

      thumb_filename = self.get_unique_name(os.path.join(thumb_dir, leaf_name))
      original_size_filename = self.get_unique_name(os.path.join(original_size_dir, leaf_name))
      thumb_url = parent_url + 'thumbs/' + os.path.split(thumb_filename)[1]
      original_size_url = parent_url + 'original/' + os.path.split(original_size_filename)[1]

      f = open(original_size_filename, 'w+')
      f.write(data)
      f.close()

      original_img = Image.open(original_size_filename)
      try:
        info = original_img._getexif()
      except:
        info = None
      exif = {}
      if info:
        for tag, value in info.items():
          decoded = TAGS.get(tag, tag)    
          exif[decoded] = value

      if 'Orientation' in exif:
        orientation = exif['Orientation']
        changed = True
        if orientation == 1:
          changed = False
        elif orientation == 2:
          # Vertical Mirror
          original_img = original_img.transpose(Image.FLIP_LEFT_RIGHT)
        elif orientation == 3:
          # Rotation 180
          original_img = original_img.transpose(Image.ROTATE_180)
        elif orientation == 4:
          # Horizontal Mirror
          original_img = original_img.transpose(Image.FLIP_TOP_BOTTOM)
        elif orientation == 5:
          # Horizontal Mirror + Rotation 270
          original_img = original_img.transpose(Image.FLIP_TOP_BOTTOM).transpose(Image.ROTATE_270)
        elif orientation == 6:
          # Rotation 270
          original_img = original_img.transpose(Image.ROTATE_270)
        elif orientation == 7:
          # Vertical Mirror + Rotation 270
          original_img = original_img.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.ROTATE_270)
        elif orientation == 8:
          # Rotation 90
          original_img = original_img.transpose(Image.ROTATE_90)

        if changed:
          original_img.save(original_size_filename, quality=95)

      thumb = Image.open(original_size_filename)
      thumb.thumbnail((content_logic.THUMB_WIDTH, content_logic.THUMB_HEIGHT), Image.ANTIALIAS)
      thumb.save(thumb_filename, quality=95)

      normal = Image.open(original_size_filename)
      normal.thumbnail((content_logic.PHOTO_WIDTH, content_logic.PHOTO_HEIGHT), Image.ANTIALIAS)
      normal.save(full_path, quality=95)

      self.display['thumb'] = thumb_url
    else:
      f = open(full_path, 'w')
      f.write(data)
      f.close()

      self.display['thumb'] = ''

    return original_size_url, url

  def get_unique_name(self, full_path):
    counter = 1
    original_path = full_path
    while os.path.exists(full_path):
      split_path = os.path.splitext(original_path)
      full_path = split_path[0] + '_' + str(counter) + split_path[1]
      counter += 1

    return full_path
