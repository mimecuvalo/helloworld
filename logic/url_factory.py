import cgi
import random
import re
import urllib
import urllib2
import urlparse
import xml.dom.minidom

import tornado.escape
from BeautifulSoup import BeautifulSoup

def load_basic_parameters(handler, prefix="", url=""):
  uri = url if url else handler.request.uri
  uri = tornado.escape.url_unescape(uri)  # Hmmm, some servers send UTF-8 percent encoded and some don't...

  if handler.prefix and uri.find(handler.prefix) == 0:
    uri = uri[len(handler.prefix):]

  if prefix and uri.find(prefix) == 0:
    uri = uri[len(prefix):]

  implied_profile = None
  if handler.constants['single_user_site'] and handler.models:
    implied_profile = handler.get_author_username()
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
  elif handler.constants['single_user_site'] and uri_array[0] != implied_profile:
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

def linkify_tags(handler, content):
  return re.compile(r'#(\w+)(?![^<&]*([>;]))', re.M | re.U).sub(r' <a href="' + handler.nav_url(username=content.username, section='search') + r'?q=%23\1" rel="tag">#\1</a>', content.view)

def clean_name(name):
  return re.compile(r'[\W]+', re.M | re.U).sub('', name.replace(" ", "_").replace("-", "_")).replace("_", "-")[:255]

def clean_filename(name):
  if name == '..' or name == '.':
    return ''
  if name.startswith('/'):  # get rid of leading /
    name = name[1:]
  return re.compile(r'[\\\/]\.\.|\.\.[\\\/]', re.M | re.U).sub('', name)

def get_remote_title_and_thumb(url):
  try:
    # XXX youtube doesn't like the scraping, too many captchas
    parsed_url = urlparse.urlparse(url)
    is_youtube = parsed_url.hostname.find('youtube.com') != -1

    if not is_youtube:
      response = urllib2.urlopen(url)
      doc = BeautifulSoup(response.read())

      title_meta = doc.find('meta', property='og:title')
      image_meta = doc.find('meta', property='og:image')
      if title_meta and image_meta:
        return (title_meta['content'], image_meta['content'])

      oembed_link = doc.find('link', type='text/xml+oembed')
    else:
      video_id = urlparse.parse_qs(parsed_url.query)['v'][0]
      oembed_link = { 'href': 'http://www.youtube.com/oembed?url=http%3A//www.youtube.com/watch?v%3D' + video_id + '&amp;format=xml' }

    if oembed_link:
      oembed = urllib2.urlopen(oembed_link['href'])
      oembed_doc = xml.dom.minidom.parseString(oembed.read())
      title = oembed_doc.getElementsByTagName('title')[0].firstChild.data
      image = oembed_doc.getElementsByTagName('thumbnail_url')[0].firstChild.data
      if is_youtube:  # they serve up hqdefault for some reason...too big
        image = 'http://i' + str(random.randint(1, 4)) + '.ytimg.com/vi/' + video_id + '/default.jpg'

      return (title, image)
  except:
    pass

  return ('', '')
