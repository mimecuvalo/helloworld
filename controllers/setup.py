import ConfigParser
import MySQLdb
import datetime
import os
import os.path
from random import choice
import string
import hashlib

from base import BaseHandler
from logic import constants
from logic import users

import tornado.escape

class SetupHandler(BaseHandler):
  def get(self):
    self.constants['debug'] = True

    if self.get_argument('kill', ''):
      os.system('kill `cat hello.pid`') # for fcgi
      os.system('touch ../tmp/restart.txt') # for passenger
      self.set_status(204)
      return

    self.display['prefix'] = self.get_argument('prefix')

    if self.request.protocol == 'http':
      self.constants['http_prefix'] = self.display['prefix']
    else:
      self.constants['https_prefix'] = self.display['prefix']

    self.prefix = (self.constants['https_prefix'] if
        self.request.protocol == 'https' else self.constants['http_prefix'])
    self.request.uri = (self.prefix +
        self.request.uri[len(tornado.escape.url_escape(
        self.prefix).replace('%2F', '/')):])

    self.fill_template("setup.html")

  def post(self):
    connection = MySQLdb.connect(host=self.get_argument('mysql_host'),
        user=self.get_argument('mysql_user'),
        passwd=self.get_argument('mysql_password'),
        db=self.get_argument('mysql_database'),
        charset="utf8", use_unicode=True)
    cursor = connection.cursor()
    initial_sql = open(os.path.normpath(os.path.realpath(__file__) +
        '/../../models/helloworld.sql'))
    cursor.execute(initial_sql.read())
    cursor.close()

    self.constants['mysql_host'] = self.get_argument('mysql_host')
    self.constants['mysql_user'] = self.get_argument('mysql_user')
    self.constants['mysql_password'] = self.get_argument('mysql_password')
    self.constants['mysql_database'] = self.get_argument('mysql_database')

    self.get_db_connection()

    user = self.models.users.get(1)

    if not user:
      user = users.create_user(self, self.get_argument('username'),
          self.get_argument('email'))
      user.author = True
      user.superuser = True
      user.save()

    users.create_empty_content(self, user.username, 'main', 'main',
        "Hello, world.",
        view="This is a brand-spankin' new Hello, world site.")

    # write site.cfg
    config = ConfigParser.RawConfigParser()
    config.add_section('general')

    for k, v in constants.defaults.items():
      config.set('general', k, v)

    if self.request.protocol == 'http':
      config.set('general', 'http_prefix', self.get_argument('prefix'))
      config.set('general', 'https_prefix', '')
    else:
      config.set('general', 'https_prefix', self.get_argument('prefix'))
      config.set('general', 'http_prefix', '')

    config.set('general', 'mysql_database',
        self.get_argument('mysql_database'))
    config.set('general', 'mysql_host', self.get_argument('mysql_host'))
    config.set('general', 'mysql_user', self.get_argument('mysql_user'))
    config.set('general', 'mysql_password',
        self.get_argument('mysql_password'))    

    xsrf_secret = ''.join([choice(string.letters) for i in range(50)])
    xsrf_secret = hashlib.sha256(xsrf_secret).hexdigest()
    config.set('general', 'xsrf_secret', xsrf_secret)

    with open(self.application.settings["config_path"], 'w') as configfile:
      config.write(configfile)
