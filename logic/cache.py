import gzip
import os
import re
import shutil

try:
    from io import BytesIO  # python 3
except ImportError:
    from cStringIO import StringIO as BytesIO  # python 2

# USAGE NOTE: you'll notice that there's no 'get' function here, check out .htaccess for that!

def get_full_filename(handler, url=None):
  if not url:
    url = handler.prefix + handler.breadcrumbs['uri']
  elif not url.startswith(handler.prefix):
    url = handler.prefix + url
  filename = url[1:].replace('../', '')  # remove leading /
  # TODO filename = handler.locale.code.replace('_', '-') + '/' + filename
  path = os.path.join(handler.application.settings["cache_path"], filename + '.htmgz')
  parent_directory = os.path.dirname(path)
  if not os.path.isdir(parent_directory):
    os.makedirs(parent_directory)
  return path

def add(handler, content, rendered_content):
  if not rendered_content:
    return

  try:
    rendered_content += '<!-- cached -->'

    gzip_value = BytesIO()
    gzip_file = gzip.GzipFile(mode="w", fileobj=gzip_value)
    gzip_file.write(rendered_content)
    gzip_file.close()
    gzipped_content = gzip_value.getvalue()

    full_path = get_full_filename(handler, handler.content_url(content))
    f = open(full_path, 'wb')
    f.write(gzipped_content)
    f.close()
  except Exception as ex:
    pass

def remove(handler, url=None):
  try:
    filename = get_full_filename(handler, url)
    os.remove(filename)

    if os.path.isdir(filename[:-6]):  # check if filename is associated with a directory (get rid of .htmgz with the -6)
      invalidate(filename[:-6])
  except:
    pass

def invalidate(cache_path):
  try:
    shutil.rmtree(cache_path) 
  except:
    pass
