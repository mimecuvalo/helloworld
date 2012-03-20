import mimetypes
import os
import os.path
import zipfile

import Image
from PIL.ExifTags import TAGS

from logic import content as content_logic
from logic import url_factory

def detect_media_type(filename):
  if filename.endswith('.webm'):  # lamesauce
    return 'video'

  mimetype = mimetypes.guess_type(filename)[0]

  if not mimetype:
    return None
  if mimetype.find('video/') == 0:
    return 'video'
  elif mimetype.find('image/') == 0:
    return 'image'
  elif mimetype.find('audio/') == 0:
    return 'audio'
  else:
    return None

def generate_full_html(handler, url, original_size_url, full_caption='', alt_text=''):
  media_type = detect_media_type(url)
  media_html = '<figure>'
  if media_type == 'image':
    media_html += '<a href="' + original_size_url + '">'
    media_html += generate_html(url, alt_text=alt_text)
    media_html += '</a>'
  elif media_type in ('video', 'audio'):
    media_html += generate_html(url, alt_text=alt_text)
    if full_caption:
      full_caption += '<br />'
    if media_type == 'video':
      full_caption += handler.locale.translate('download video:') + ' '
    else:
      full_caption += handler.locale.translate('download audio:') + ' '
    full_caption += '<a href="' + url + '">' + url[url.rfind('/') + 1:] + '</a>'
  else:
    media_html += '<a href="' + url + '">' + url[url.rfind('/') + 1:] + '</a>'

  if full_caption:
    media_html += '<figcaption>' + full_caption + '</figcaption>'

  media_html += '</figure>'

  return media_html

def generate_html(filename, alt_text=''):
  media_type = detect_media_type(filename)
  mimetype = mimetypes.guess_type(filename)[0]

  if filename.endswith('.webm'):  # lamesauce
    mimetype = 'video/webm'

  if media_type == 'image':
    return '<img src="' + filename + '" alt="' + alt_text + '">'
  elif media_type == 'video':
    return '<video controls alt="' + alt_text + '" width="500">' \
         +   '<source src="' + filename + '" type="' + mimetype + '" onerror="hw.videoError(this)" >' \
         + '</video>'
  elif media_type == 'audio':
    return '<audio controls alt="' + alt_text + '">' \
         +   '<source src="' + filename + '" type="' + mimetype + '" onerror="hw.audioError(this)" >' \
         + '</audio>'
  else:
    return filename

def save_locally(parent_url, full_path, data, skip_write=False):
  # check dupe
  if not skip_write:
    full_path = get_unique_name(full_path)

  media_type = detect_media_type(full_path)
  original_size_url = ''
  url = os.path.join(parent_url, os.path.split(full_path)[1])
  thumb_url = ''

  if media_type == 'image':
    split_path = os.path.split(full_path)
    thumb_dir = os.path.join(split_path[0], 'thumbs')
    original_size_dir = os.path.join(split_path[0], 'original')
    leaf_name = os.path.split(full_path)[1]

    if not os.path.isdir(thumb_dir):
      os.makedirs(thumb_dir)
    if not os.path.isdir(original_size_dir):
      os.makedirs(original_size_dir)

    thumb_filename = get_unique_name(os.path.join(thumb_dir, leaf_name))
    original_size_filename = get_unique_name(os.path.join(original_size_dir, leaf_name))
    thumb_url = os.path.join(os.path.join(parent_url, 'thumbs'), os.path.split(thumb_filename)[1])
    original_size_url = os.path.join(os.path.join(parent_url, 'original'), os.path.split(original_size_filename)[1])

    if skip_write:
      os.rename(full_path, original_size_filename)
    else:
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
  else:
    if not skip_write:
      f = open(full_path, 'w')
      f.write(data)
      f.close()

    if os.path.splitext(full_path)[1] == '.zip':
      z = zipfile.ZipFile(full_path)
      for f in z.namelist():
        if f.endswith('/'):
          os.makedirs(os.path.join(os.path.dirname(full_path), url_factory.clean_filename(f)))
        else:
          z.extract(url_factory.clean_filename(f), os.path.dirname(full_path))

  return original_size_url, url, thumb_url

def get_unique_name(full_path):
  counter = 1
  original_path = full_path
  while os.path.exists(full_path):
    split_path = os.path.splitext(original_path)
    full_path = split_path[0] + '_' + str(counter) + split_path[1]
    counter += 1

  return full_path
