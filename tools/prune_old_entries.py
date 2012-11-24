#!/usr/bin/env python

import sys, os
if sys.version < "2.6":
  os.execl("/usr/local/bin/python2.6", "python2.6", *sys.argv)

import ConfigParser
import datetime
import urllib2

sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) +
    '/../../'))
sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) +
    '/../../packages'))

from logic import constants as constants_module

config = ConfigParser.ConfigParser()
config.read(os.path.normpath(os.path.realpath(__file__) + '/../../site.cfg'))
constants = dict(constants_module.dictionary.items() +
    constants_module.defaults.items() + config.items('general'))
for constant in constants:
  try:
    constants[constant] = int(constants[constant])
  except:
    pass

from autumn.db.connection import autumn_db
autumn_db.conn.connect('mysql', host=constants['mysql_host'],
    user=constants['mysql_user'], passwd=constants['mysql_password'],
    db=constants['mysql_database'], charset="utf8", use_unicode=True)
from models import base as models

types = ['post'] + constants['external_sources'] + ['remote-comment']
for t in types:
  content_options = {
    'type': t,
    'favorited': False,
    'local_content_name': '',
    'date_created <': datetime.datetime.utcnow() -
              datetime.timedelta(days=constants['feed_max_days_old'])
  }  
  content_remote = models.content_remote.get(**content_options)[:]

  for content in content_remote:
    try:
      content.delete()
    except:
      pass
