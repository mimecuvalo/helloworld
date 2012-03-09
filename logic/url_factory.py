import cgi
import os.path
import re
import urllib

import tornado.escape
from BeautifulSoup import BeautifulSoup

def load_basic_parameters(handler, prefix="", url=""):
  uri = url if url else handler.request.uri
  uri = tornado.escape.url_unescape(uri)  # Hmmm, some servers send UTF-8 percent encoded and some don't...
  uri = tornado.escape.url_unescape(uri)  # XXX WTF?? it's double-escaped??? something's weird here.  FIX

  if handler.prefix and uri.find(handler.prefix) == 0:
    uri = uri[len(handler.prefix):]

  if prefix and uri.find(prefix) == 0:
    uri = uri[len(prefix):]

  implied_profile = None
  hostname_user = None
  if handler.models:
    hostname_user = handler.get_user_by_hostname()

  if handler.constants['single_user_site'] and handler.models:
    implied_profile = handler.get_author_username()
  elif hostname_user:
    implied_profile = hostname_user.username
  elif handler.current_user is not None:
    implied_profile = handler.current_user.get('username', None)

  uri_array = uri.split("/")
  uri_array.pop(0)
  uri_array = [sanitize_form_value(x) for x in uri_array]

  uri_dict = {
    'uri': uri,
    'profile': None,
    'section': None,
    'album': None,
    'name': None,
    'modifier': None,
    'private': None,
  }

  if len(uri_array) == 0 or uri_array[0] == "":
    uri_dict['profile'] = implied_profile or (handler.models.users.get(1).username if handler.models else '')
    uri_dict['section'] = 'main'
    uri_dict['name']    = 'main'
    return uri_dict

  if uri_array[0] == 'private':
    uri_dict['private'] = '/'.join(uri_array[1:])
    return uri_dict

  if uri_array[0] in handler.constants['reserved_names']:
    uri_array.insert(0, implied_profile)
  elif (handler.constants['single_user_site'] or hostname_user) and uri_array[0] != implied_profile:
    uri_array.insert(0, implied_profile)

  uri_dict['profile'] = uri_array[0]

  if len(uri_array) == 1:
    uri_array.append('home')
  elif uri_array[1] == "":
    uri_array[1] = 'home'

  if uri_array[1] == "page":
    uri_dict["section"] = 'main'
    uri_dict["name"] = 'home'
    uri_dict["modifier"] = uri_array[2]
  elif len(uri_array) > 2 and uri_array[2] != "" and uri_array[2] != "page":
    uri_dict["section"] = uri_array[1]
    uri_dict["name"] = uri_array[2]
    if len(uri_array) > 3 and uri_array[3] == "page":
      uri_dict["modifier"] = uri_array[4]
  else:
    uri_dict["section"] = 'main'
    uri_dict["name"] = uri_array[1]
    if len(uri_array) > 2 and uri_array[2] == "page":
      uri_dict["modifier"] = uri_array[3]

  uri_dict["name"] = reverse_href(urllib.unquote_plus(uri_dict["name"]))

  return uri_dict

def sanitize_form_value(value):
  main_regex = re.compile("<|>|&#|script\:", re.IGNORECASE)
  value = main_regex.sub("_", value)
  value = re.sub("&amp;", "&", value)	# prevent something that is already &amp; from becoming &amp;amp;
  value = re.sub("&", "&amp;", value)

  if value.find('?') != -1:
    value = value[:value.find('?')]  # get rid of arguments

  return value;

def href(url):
  return url.replace(" ", "+")

def reverse_href(url):
  return url.replace("+", " ")

def add_base_uris(handler, view):
  return re.compile(r'(["\'])(static/resource)', re.M | re.U).sub(r'\1' + handler.base_uri + r'\2', view)

# xxx, this is now done in wysiwyg
def linkify_tags(handler, content):
  return re.compile(r'#(\w+)(?![^<&]*([>;]))', re.M | re.U).sub(r' <a href="' + handler.nav_url(username=content.username, section='search') + r'?q=%23\1" rel="tag">#\1</a>', content.view)

def clean_name(name):
  return re.compile(r'[\W]+', re.M | re.U).sub('', name.replace(" ", "_").replace("-", "_")).replace("_", "-")[:255]

def check_legit_filename(full_path):
  leafname = os.path.basename(full_path)
  if leafname in ('crossdomain.xml', 'clientaccesspolicy.xml', '.htaccess', '.htpasswd'):
    raise tornado.web.HTTPError(400, "i call shenanigans")

def clean_filename(name):
  if name == '..' or name == '.':
    return ''

  check_legit_filename(name)

  if name.startswith('/'):  # get rid of leading /
    name = name[1:]
  return re.compile(r'[\\\/]\.\.|\.\.[\\\/]', re.M | re.U).sub('', name)
