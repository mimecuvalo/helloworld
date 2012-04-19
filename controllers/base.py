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
from logic import content as content_logic
from logic import url_factory

class BaseHandler(tornado.web.RequestHandler):
  def initialize(self):
    self.display = { }
    self.constants = self.application.settings["constants"]
    self.check_version()

    try:
      self.get_db_connection()
    except:
      self.models = None
      pass
    self.author_user = None
    self.hostname_user = None
    self.display["original_uri"] = self.request.uri
    self.request.uri = self.request.uri.replace('/helloworld.py', '')
    prefix_constant = self.constants['https_prefix'] if self.request.protocol == 'https' else self.constants['http_prefix']
    if self.request.uri.startswith(tornado.escape.url_escape(prefix_constant).replace('%2F', '/')):
      self.prefix = prefix_constant
    else:
      self.prefix = ""
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
    self.display["bidi"] = content_logic.bidi
    self.display["content"] = None
    self.display["tag_date"] = "2011-09-25"
    self.display["random"] = random
    self.display["urllib"] = urllib
    self.display["content_url"] = self.content_url
    self.display["resource_url"] = url_factory.resource_url
    self.display["js_escape"] = content_logic.js_escape
    self.display["js_in_html_escape"] = content_logic.js_in_html_escape
    self.display["referrer"] = None
    self.display["nav_url"] = self.nav_url
    self.display["add_base_uris"] = self.add_base_uris
    self.display["breadcrumbs"] = self.breadcrumbs
    self.display["is_owner_viewing"] = False
    self.display["single_user_site"] = self.constants['single_user_site']
    self.display["base_uri"] = self.base_uri
    self.display["base_path"] = self.base_path
    self.display["prefix"] = self.prefix
    self.display["section_template"] = None
    self.display["has_code"] = False
    self.display["strip_html"] = content_logic.strip_html
    self.display["ellipsize"] = content_logic.ellipsize
    self.display["source_website"] = self.constants['source_website']
    self.display["licenses"] = self.constants['licenses']
    self.display["current_datetime"] = datetime.datetime.utcnow()
    self.display["is_dashboard"] = False

  def check_version(self):
    try:
      version_path = os.path.join(os.path.dirname(self.application.settings["app_path"]), 'mod_time')
      if self.constants['use_mod_rails']:
        touched_path = self.application.settings["restart_path"]
      else:
        touched_path = self.application.settings["app_path"]
      touched_time = str(os.stat(touched_path).st_mtime)
      helloworld_changed = False
      if os.path.exists(version_path):
        f = open(version_path, 'r')
        cache_mod_time = f.read()
        f.close()
        helloworld_changed = cache_mod_time != touched_time
        if (helloworld_changed):
          cache.invalidate(self.application.settings["cache_path"])

      f = open(version_path, 'w')
      f.write(touched_time)
      f.close()
    except:
      pass

  def get_user_information(self):
    if self.current_user:
      user = self.models.users.get(email=self.current_user["email"])[0]
      self.current_user["user"]      = user           if user else None
      self.current_user["userid"]    = user.id        if user else None
      self.current_user["username"]  = user.username  if user else None
      self.current_user["author"]    = user.author    if user else 0
      self.current_user["superuser"] = user.superuser if user else 0
      self.current_user["avatar"]    = user.logo      if user else hashlib.md5(self.current_user["email"].lower()).hexdigest()
      self.display["username"]     = self.current_user["username"]
      self.display["userid"]       = self.current_user["userid"]
      self.display["is_author"]    = self.current_user["author"]
      self.display["is_superuser"] = self.current_user["superuser"]
    else:
      self.display["username"]     = None
      self.display["userid"]       = None
      self.display["is_author"]    = False
      self.display["is_superuser"] = False

  def get_user_by_hostname(self):
    if not self.hostname_user:
      self.hostname_user = self.models.users.get(hostname=self.request.host)[0]
    return self.hostname_user

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
      if status_code == 404:
        logging.error('404: ' + self.display["original_uri"] + ' ' + self.request.headers["User-Agent"])
      else:
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
    if self.request.protocol == 'https' or not self.constants['http_hide_prefix']:
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
    return url_factory.content_url(self, item, host, **arguments)

  def nav_url(self, host=False, username="", section="", name="", page=None, **arguments):
    return url_factory.nav_url(self, host, username, section, name, page, **arguments)

  def add_base_uris(self, view):
    return url_factory.add_base_uris(self, view)

  def prevent_caching(self):
    self.set_header("Last-Modified", "Fri, 02 Jan 1970 14:19:41 GMT")
    self.set_header("Expires", "Fri, 02 Jan 1970 14:19:41 GMT")
    self.set_header("Cache-Control", "no-store, no-cache, must-revalidate, post-check=0, pre-check=0")
    self.set_header("Pragma", "no-cache")
