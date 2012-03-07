import binascii
import datetime
import hashlib
import httplib
import logging
import os
import os.path
import random
import re
import sys
import traceback
import types
import urllib
import uuid

import jspacker
import tornado.database
import tornado.escape
import tornado.web
from tornado.web import RequestHandler

from logic import cache
from logic import url_factory

class BaseHandler(tornado.web.RequestHandler):
  def initialize(self):
    self.display = { }
    self.check_version()

    self.constants = self.application.settings["constants"]
    try:
      self.get_db_connection()
    except:
      self.models = None
      pass
    self.author_user = None
    self.request.uri = self.request.uri.replace('/helloworld.py', '')
    self.prefix = self.constants['https_prefix'] if self.request.protocol == 'https' else self.constants['http_prefix']
    self.base_path = (self.prefix if not self.constants['http_hide_prefix'] else '')
    if self.base_path == '':
      self.base_path = '/'
    self.base_uri = self.request.protocol + '://' + self.request.host + self.base_path
    if not self.base_uri.endswith('/'):
      self.base_uri += '/'
    self.request.uri = (self.prefix if not self.constants['http_hide_prefix'] else '') + self.request.uri[len(tornado.escape.url_escape(self.prefix).replace('%2F', '/')):]
    self.breadcrumbs = url_factory.load_basic_parameters(self)
    self.template = None
    self.content = None
    self.owner_viewing = False
    self.display["is_superuser"] = False

    if self.request.protocol == 'https':
      self.include_host = True

    self.get_user_information()

    self.display["display"] = self.display
    self.display["bidi"] = self.bidi
    self.display["content"] = None
    self.display["tag_date"] = "2011-09-25"
    self.display["random"] = random
    self.display["urllib"] = urllib
    self.display["content_url"] = self.content_url
    self.display["resource_url"] = self.resource_url
    self.display["js_escape"] = self.js_escape
    self.display["js_in_html_escape"] = self.js_in_html_escape
    self.display["referrer"] = None
    self.display["nav_url"] = self.nav_url
    self.display["add_base_uris"] = self.add_base_uris
    self.display["breadcrumbs"] = self.breadcrumbs
    self.display["is_owner_viewing"] = False
    self.display["single_user_site"] = self.constants['single_user_site']
    self.display["base_uri"] = self.base_uri
    self.display["base_path"] = self.base_path
    self.display["prefix"] = self.prefix
    self.display["has_code"] = False
    self.display["strip_html"] = self.strip_html
    self.display["ellipsize"] = self.ellipsize
    self.display["source_website"] = self.constants['source_website']
    self.display["licenses"] = self.constants['licenses']
    self.display["current_datetime"] = datetime.datetime.utcnow()

  def check_version(self):
    try:
      version_path = os.path.join(os.path.dirname(self.application.settings["app_path"]), 'mod_time')
      helloworld_changed = False
      if os.path.exists(version_path):
        f = open(version_path, 'r')
        cache_mod_time = f.read()
        f.close()
        helloworld_changed = cache_mod_time != str(os.stat(self.application.settings["app_path"]).st_mtime)
        if (helloworld_changed):
          cache.invalidate(self.application.settings["cache_path"])

      f = open(version_path, 'w')
      f.write(str(os.stat(self.application.settings["app_path"]).st_mtime))
      f.close()
    except:
      pass

  def get_user_information(self):
    if self.current_user:
      user = self.models.users.get(oauth=self.current_user["email"])[0]
      self.current_user["user"]      = user           if user else None
      self.current_user["userid"]    = user.id        if user else None
      self.current_user["username"]  = user.username  if user else None
      self.current_user["author"]    = user.author    if user else 0
      self.current_user["superuser"] = user.superuser if user else 0
      self.display["username"] = self.current_user["username"]
      self.display["userid"] = self.current_user["userid"]
      self.display["is_author"] = self.current_user["author"]
      self.display["is_superuser"] = self.current_user["superuser"]
    else:
      self.display["username"] = None
      self.display["userid"] = None
      self.display["is_author"] = False
      self.display["is_superuser"] = False

  def get_author_user(self):
    if not self.author_user:
      self.author_user = self.models.users.get(1) if self.constants['single_user_site'] else self.current_user["user"]

    return self.author_user

  def get_author_username(self):
    return self.get_author_user().username

  def is_owner_viewing(self, profile):
    return self.current_user and self.current_user["username"] == profile

  def fill_debug_info(self):
    self.display["show_debug"] = self.constants['debug']
    self.display["debug_info"] = ""
    if self.constants['debug'] and self.display["is_superuser"]:
      self.display["debug_info"] += repr(self.display).replace(',', ',\n').replace('<!--', '').replace('-->', '')

  def fill_template(self, template="view.html"):
    self.fill_debug_info()
    rendered_content = self.render_string(template, **self.display)
    self.write(rendered_content)
    return rendered_content

  def js_escape(self, string):
    return string.replace("'", "\\'").replace('"', '\\"')

  def js_in_html_escape(self, string):
    return tornado.escape.xhtml_escape(string).replace("'", "&#39;").replace('"', '&quot;')

  def bidi(self, string):
    # modified from goog.i18n.bidi
    # Copyright 2007 The Closure Library Authors. All Rights Reserved.
    #
    # Licensed under the Apache License, Version 2.0 (the "License");
    # you may not use this file except in compliance with the License.
    # You may obtain a copy of the License at
    #
    #      http://www.apache.org/licenses/LICENSE-2.0
    #
    # Unless required by applicable law or agreed to in writing, software
    # distributed under the License is distributed on an "AS-IS" BASIS,
    # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    # See the License for the specific language governing permissions and
    # limitations under the License.
    rtlChars_ = ur'\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC'
    ltrChars_ = ur'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u2C00-\uFB1C\uFE00-\uFE6F\uFEFD-\uFFFF';
    rtlDirCheckRe_ = ur'^[^' + ltrChars_ + ur']*[' + rtlChars_ + ur']'
    htmlSkipReg_ = ur'<[^>]*>|&[^;]+;'
    return 'dir="rtl"' if re.search(rtlDirCheckRe_, re.sub(htmlSkipReg_, '', string)) else ''

  def authenticate(self, author=False, superuser=False, content=None, private_resource=None, auto_login=True):
    access_granted = False

    if author or superuser:
      if not self.current_user:
        if auto_login:
          self.login()
        return False

      if superuser and self.current_user["superuser"]:
        access_granted = True
      elif author and self.current_user["author"]:
        access_granted = True
    else:
      access_granted = True

    if content or private_resource:
      if content:
        access_table = self.models.content_access.get(content=content.id)
      else:
        access_table = self.models.resource_access.get(url=private_resource)

      if len(access_table):
        if not self.current_user:
          if auto_login:
            self.login()
          return False

        access_granted = False

        if self.current_user["userid"]:
          for access_entry in access_table:
            if self.current_user["userid"] == access_entry.user and access_entry.has_access:
              access_granted = True
              break

    if not access_granted:
      raise tornado.web.HTTPError(403)

    return True

  @tornado.web.authenticated
  def login(self):
    # this will just redirect to AuthHandler
    pass

  def get_login_url(self):
    """Override to customize the login URL based on the request.

    By default, we use the 'login_url' application setting.
    """
    self.require_setting("login_url", "@tornado.web.authenticated")
    self.request.uri = self.request.uri

    url = ""
    if not self.constants['http_hide_prefix']:
      url += self.prefix

    url += self.application.settings["login_url"]

    url += "?" + urllib.urlencode(dict(next=self.request.uri))

    return url

  def get_db_connection(self):
    from autumn.db.connection import autumn_db
    autumn_db.conn.connect('mysql', host=self.constants['mysql_host'], user=self.constants['mysql_user'], passwd=self.constants['mysql_password'], db=self.constants['mysql_database'], charset="utf8", use_unicode=True)
    self.db = autumn_db

    from models import base as models
    self.models = models

  def get_current_user(self):
    if self.application.settings["cookie_secret"] and self.get_secure_cookie("user"):
      return tornado.escape.json_decode(self.get_secure_cookie("user"))
    else:
      return None

  def write_error(self, status_code, **kwargs):
    output = ""
    for line in traceback.format_exception(*kwargs["exc_info"]):
      output += line
    output += str(status_code) + "\n\n" \
           +  httplib.responses[status_code] + "\n\n" \
           +  tornado.escape.xhtml_escape(repr(self.display)).replace(',', ',\n')

    if self.constants['debug']:
      self.display["debug_info"] = ""
      self.display["licenses"] = ""
      self.display["current_datetime"] = ""
      for key, item in self.display.items():
        if isinstance(item, types.ModuleType) or isinstance(item, types.MethodType):
          del self.display[key]

      self.set_header('Content-Type', 'text/plain')
      self.write(output)
      self.finish()
    else:
      self.display["status_code"] = status_code
      self.display["profile"] = self.breadcrumbs["profile"]
      self.display["name"] = self.breadcrumbs["name"]
      self.fill_debug_info()
      logging.error(output)
      self.fill_template("error.html")

  def static_url(self, path, include_filename=None, include_host=False):
    """Returns a static URL for the given relative static file path.

    This method requires you set the 'static_path' setting in your
    application (which specifies the root directory of your static
    files).

    We append ?v=<signature> to the returned URL, which makes our
    static file handler set an infinite expiration header on the
    returned content. The signature is based on the content of the
    file.

    If this handler has a "include_host" attribute, we include the
    full host for every static URL, including the "http://". Set
    this attribute for handlers whose output needs non-relative static
    path names.
    """
    self.require_setting("static_path", "static_url")
    if not hasattr(RequestHandler, "_static_hashes"):
      RequestHandler._static_hashes = {}
    hashes = RequestHandler._static_hashes
    abs_path = os.path.join(self.application.settings["static_path"],
                            path)
    is_js = os.path.splitext(path)[1] == '.js'
    if abs_path not in hashes:
      try:
        if include_filename:
          include_file = open(os.path.join(self.application.settings["static_path"],
                                           include_filename))
          combined_file = ''
          lines = include_file.readlines()
          for dependency in lines:
            file_abs_path = os.path.join(self.application.settings["static_path"],
                                         dependency.replace('\n', ''))
            f = open(file_abs_path)
            combined_file = combined_file + '\n' + f.read()
            f.close()
          include_file.close()
          # XXX too many problems with jspacker...
          #if is_js:
          #  packer = jspacker.JavaScriptPacker()
          #  combined_file = packer.pack(combined_file, encoding=62, fastDecode=True)
          f = open(abs_path, 'w')
          f.write(combined_file)
          f.close()

        f = open(abs_path)
        hashes[abs_path] = hashlib.md5(f.read()).hexdigest()
        f.close()
      except:
        logging.error("Could not open static file %r", path)
        hashes[abs_path] = None
    base = self.request.protocol + "://" + self.request.host \
      if getattr(self, "include_host", False) or include_host else ""
    if not self.constants['http_hide_prefix']:
      base += self.prefix
    static_url_prefix = self.settings.get('static_url_prefix', '/static/')
    if hashes.get(abs_path):
      return base + static_url_prefix + path + "?v=" + hashes[abs_path][:5]
    else:
      return base + static_url_prefix + path

  @property
  def xsrf_token(self):
    """ Modified to add path to cookie"""

    """The XSRF-prevention token for the current user/session.

    To prevent cross-site request forgery, we set an '_xsrf' cookie
    and include the same '_xsrf' value as an argument with all POST
    requests. If the two do not match, we reject the form submission
    as a potential forgery.

    See http://en.wikipedia.org/wiki/Cross-site_request_forgery
    """
    if not hasattr(self, "_xsrf_token"):
      token = self.get_cookie("_xsrf")
      if not token:
        token = binascii.b2a_hex(uuid.uuid4().bytes)
        expires_days = 30 if self.current_user else None
        self.set_cookie("_xsrf", token, expires_days=expires_days, path=self.base_path)
      self._xsrf_token = token
    return self._xsrf_token

  def content_url(self, item, host=False, **arguments):
    url = ""

    if host:
      url += self.request.protocol + "://" + self.request.host

    if not self.constants['http_hide_prefix']:
      url += self.prefix

    if not self.constants['single_user_site']:
      url += '/' + item.username

    args = ""
    if arguments:
      for arg in arguments:
        arguments[arg] = arguments[arg].encode('utf-8')
      args = '?' + urllib.urlencode(arguments)

    return url_factory.href(url + ('/' + item.section if item.section != 'main' else '') \
        + ('/' + item.name if item.name != 'home' else '')) + args

  def nav_url(self, host=False, username="", section="", name="", page=None, **arguments):
    url = ""

    if host:
      url += self.request.protocol + "://" + self.request.host

    if not self.constants['http_hide_prefix']:
      url += self.prefix

    if not self.constants['single_user_site'] and username:
      url += '/' + username

    if section:
      url += '/' + section
      if name:
        url += '/' + name

    if page:
      url += '/page/' + str(page)

    args = ""
    if arguments:
      for arg in arguments:
        arguments[arg] = arguments[arg].encode('utf-8')
      args = '?' + urllib.urlencode(arguments)

    return (url_factory.href(url) + args) or "/"

  def add_base_uris(self, view):
    return url_factory.add_base_uris(self, view);

  def resource_directory(self, section="", album=""):
    path = self.application.settings["resource_path"]

    path = os.path.join(path, self.get_author_username())

    if section:
      path = os.path.join(path, section)

    if album:
      path = os.path.join(path, album)

    return path

  def resource_url(self, section="", album="", resource="", filename=""):
    if filename:
      return self.application.settings["resource_url"] \
           + filename.replace(self.application.settings["resource_path"], '')

    path = self.application.settings["resource_url"] + '/'

    path += self.get_author_username()

    if section:
      path += '/' + section + '/'

    if album:
      path += album + '/'

    if resource:
      path += resource + '/'

    return path

  def generate_sitemap(self, content):
    if type(content) is list and len(content):
      content = content[0]

    if content and content.section != 'main':
      profile = content.username
      section = content.section
      if content.album == 'main':
        album = content.name
      else:
        album = content.album
    else:
      profile = self.breadcrumbs["profile"]
      section = self.breadcrumbs["name"]
      album = None

    return self.get_sections_with_albums(profile=profile, section=section, album=album)

  def get_main_sections(self, profile):
    content_options = { 'username': profile,
                        'section': 'main', }

    if not self.is_owner_viewing(profile):
      content_options['hidden'] = False

    sections = self.models.content.get(**content_options).order_by('order')[:]
    filtered_sections = []
    for section in sections:
      if not (section.name == 'home' or section.name == 'main' or section.name == 'comments' or section.redirect):
        filtered_sections.append(section)

    return filtered_sections

  def get_albums(self, profile, section):
    content_options = { 'username': profile,
                        'section': section,
                        'album': 'main', }

    if not self.is_owner_viewing(profile):
      content_options['hidden'] = False

    return self.models.content.get(**content_options).order_by('order')[:]

  def get_sections_with_albums(self, profile, section=None, album=None):
    sitemap = []
    main_sections = self.get_main_sections(profile)

    for main_section in main_sections:
      main_section_name = main_section.name
      main_section_title = main_section.title

      albums = [ { 'name': main_album.name,
                   'title': main_album.title,
                   'hidden': main_album.hidden,
                   'template': main_album.template,
                   'selected': main_album.name == album and main_section_name == section }
                 for main_album in self.get_albums(profile=profile, section=main_section_name) if not main_album.redirect ]
      sitemap.append({ 'username': profile,
                       'title': main_section_title,
                       'name': main_section_name,
                       'albums': albums,
                       'hidden': main_section.hidden,
                       'template': main_section.template,
                       'selected': main_section_name == section })

    return sitemap

  def create_section(self, profile, section, original_template=""):
    if section == 'main':
      return section

    title = section
    section = url_factory.clean_name(section)

    if section in self.constants['reserved_names']:
      self.set_status(400)
      self.write("dup-section")
      raise tornado.web.HTTPError(400)

    section_item = self.models.content.get(username=profile,
                                           section='main',
                                           name=section)[0]
    if not section_item:
      new_section = self.models.content()
      new_section.username = profile
      new_section.section  = 'main'
      section = self.get_unique_name(content=new_section, title=title)
      new_section.name     = section
      new_section.title    = title
      new_section.template = original_template
      new_section.date_created = datetime.datetime.utcnow()
      new_section.date_updated = datetime.datetime.utcnow()
      new_section.save()

    return section

  def rename_section(self, old_name, new_name, new_title):
    new_name = url_factory.clean_name(new_name)

    profile = self.get_author_username()

    section_item = self.models.content.get(username=profile,
                                           section='main',
                                           name=old_name)[0]
    section_item.name = new_name
    section_item.title = new_title
    section_item.save()

    collection = self.models.content.get(username=profile,
                                         section=old_name)[:]
    for item in collection:
      item.section = new_name
      item.save()

    self.create_redirect(section_item, 'main', old_name)

    return new_name

  def create_album(self, profile, section, album, original_template=""):
    if not album:
      return ""

    if album == 'main':
      return album

    title = album
    album = url_factory.clean_name(album)

    if album in self.constants['reserved_names']:
      self.set_status(400)
      self.write("dup-album")
      raise tornado.web.HTTPError(400)

    album_item = self.models.content.get(username=profile,
                                         section=section,
                                         album='main',
                                         name=album)[0]
    if not album_item:
      new_album = self.models.content()
      new_album.username = profile
      new_album.section  = section
      new_album.album    = 'main'
      album = self.get_unique_name(content=new_album, title=title)
      new_album.name     = album
      new_album.title    = title
      new_album.template = original_template
      new_album.date_created = datetime.datetime.utcnow()
      new_album.date_updated = datetime.datetime.utcnow()
      new_album.save()

    return album

  def rename_album(self, old_section, old_name, new_name, new_title):
    new_name = url_factory.clean_name(new_name)

    profile = self.get_author_username()

    album_item = self.models.content.get(username=profile,
                                         section=old_section,
                                         album='main',
                                         name=old_name)[0]
    album_item.name = new_name
    album_item.title = new_title
    album_item.save()

    collection = self.models.content.get(username=profile,
                                         section=old_section,
                                         album=old_name)[:]
    for item in collection:
      item.album = new_name
      item.save()

    self.create_redirect(album_item, old_section, old_name)

    return new_name

  def create_redirect(self, original, old_section, old_name):
    redirect_content = self.models.content()
    redirect_content.redirect = original.id
    redirect_content.username = original.username
    redirect_content.section  = old_section
    redirect_content.name     = old_name
    redirect_content.date_created = original.date_created
    redirect_content.date_updated = original.date_updated
    redirect_content.save()

  def get_unique_name(self, content, name="_", title=None):
    if not title:
      title = self.locale.translate('untitled')

    # check to see if name is unique
    if name and name != '_':
      name = url_factory.clean_name(name)
      existing_content = self.models.content.get(username=content.username, name=name)[0]
      if (existing_content and existing_content.id != content.id) or name in self.constants['reserved_names']:
        self.set_status(400)
        self.write("dup-name")
        raise tornado.web.HTTPError(400)
    else:
      name = url_factory.clean_name(title)
      new_name = name
      counter = 1
      options = { 'username': content.username, 'name like': new_name + '-%' }
      highest_existing_name = self.models.content.get(**options).order_by('id', 'DESC')[0]
      if highest_existing_name:
        existing_counter = highest_existing_name.name.split('-')[1]
        try:
          counter = int(existing_counter) + 1
          new_name = name + '-' + str(counter)
        except:
          pass # if existing_counter is not a possible number
      while True:
        existing_content = self.models.content.get(username=content.username, name=new_name)[0]
        if existing_content or new_name in self.constants['reserved_names']:
          new_name = name + '-' + str(counter)
          counter += 1
        else:
          name = new_name
          break

    return name

  def get_collection(self, profile=None, section=None, name=None):
    profile = profile or self.breadcrumbs["profile"]
    section = section or self.breadcrumbs["section"]
    name = name or self.breadcrumbs["name"]

    common_options = { 'redirect': False }
    if not self.is_owner_viewing(profile) and not self.display["content"].hidden:
      common_options['hidden'] = False

    if section != 'main':
      collection_entry = self.models.content.get(username=profile, name=section)[0]
    if section == 'main' or not collection_entry.sort_type:
      collection_entry = self.models.content.get(username=profile, name=name)[0]

    sort_type, sort_direction = self.get_sort_directives(collection_entry.sort_type)

    collection = None
    if section != 'main':
      content_options = { 'username' : profile,
                          'section' : section,
                          'album' : name, }
      content_options = dict(common_options.items() + content_options.items())
      collection = self.models.content.get(**content_options).order_by(sort_type, sort_direction)[:]

    if not collection:
      content_options = { 'username' : profile,
                          'section' : name,
                          'album' : 'main', }
      content_options = dict(common_options.items() + content_options.items())
      collection = self.models.content.get(**content_options).order_by(sort_type, sort_direction)[:]

      album_options = content_options
      for item in collection:
        album_options['album'] = item.name
        album_sort_type, album_sort_direction = self.get_sort_directives(item.sort_type)
        album_item = self.models.content.get(**content_options).order_by(album_sort_type, album_sort_direction)[0]
        if album_item:
          item.thumb = album_item.thumb

      content_options = { 'username' : profile,
                          'section' : name,
                          'album' : '', }
      content_options = dict(common_options.items() + content_options.items())
      collection += self.models.content.get(**content_options).order_by(sort_type, sort_direction)[:]

    if not collection and section != 'main':
      content_options = { 'username' : profile,
                          'section' : section, }
      content_options = dict(common_options.items() + content_options.items())
      collection = self.models.content.get(**content_options).order_by(sort_type, sort_direction)[:]

    return collection, common_options

  def get_sort_directives(self, entry_sort_type):
    sort_type = 'date_created'
    sort_direction = 'DESC'
    if entry_sort_type == 'oldest':
      sort_direction = 'ASC'
    elif entry_sort_type == 'alphabetical':
      sort_type = 'title'
      sort_direction = 'ASC'
    sort_type = 'order,' + sort_type

    return sort_type, sort_direction

  def prevent_caching(self):
    self.set_header("Last-Modified", "Fri, 02 Jan 1970 14:19:41 GMT")
    self.set_header("Expires", "Fri, 02 Jan 1970 14:19:41 GMT")
    self.set_header("Cache-Control", "no-store, no-cache, must-revalidate, post-check=0, pre-check=0")
    self.set_header("Pragma", "no-cache")

  def strip_html(self, html):
    text = re.compile(r'<[^<]+?>|&.+?;', re.M | re.U).sub('', html)
    return re.compile(r'\s+').sub(' ', text)

  def ellipsize(self, text, max_length):
    if len(text) <= max_length:
      return text
    return text[:max_length] + '...'
