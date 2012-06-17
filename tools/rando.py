#!/usr/bin/env python

import sys, os
if sys.version < "2.6":
  os.execl("/usr/local/bin/python2.6", "python2.6", *sys.argv)

sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) +
    '/../../'))
sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) +
    '/../../packages'))

from logic import constants as constants_module

import ConfigParser
config = ConfigParser.ConfigParser()
config.read('../site.cfg')
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

def fixstuff():
  import random

  content = models.content.get()[:]
  for item in content:
    item.id_shortlink = long(2**32*random.random())
    item.save()

#fixstuff()
