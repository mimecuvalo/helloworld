import ConfigParser
import datetime
import sys, os
import urllib2

sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) + '/../../'))
sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) + '/../../packages'))

from BeautifulSoup import BeautifulSoup
from logic import constants as constants_module

config = ConfigParser.ConfigParser()
config.read(os.path.normpath(os.path.realpath(__file__) + '/../../site.cfg'))
constants = dict(constants_module.dictionary.items() + config.items('general'))

from autumn.db.connection import autumn_db
autumn_db.conn.connect('mysql', host=constants['mysql_host'], user=constants['mysql_user'], passwd=constants['mysql_password'], db=constants['mysql_database'], charset="utf8", use_unicode=True)
from models import base as models


content_remote = models.content_remote.get(type='post')[:]

for content in content_remote:
  try:
    if content.date_created < datetime.datetime.utcnow() - datetime.timedelta(days=30):
      content.delete()
  except:
    pass
