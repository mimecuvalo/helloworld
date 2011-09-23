import ConfigParser
import sys, os
import urllib2

sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) + '/../../'))
sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) + '/../../packages'))

from BeautifulSoup import BeautifulSoup
from logic import constants as constants_module
from logic import remote_content

config = ConfigParser.ConfigParser()
config.read(os.path.normpath(os.path.realpath(__file__) + '/../../site.cfg'))
constants = dict(constants_module.dictionary.items() + config.items('general'))

from autumn.db.connection import autumn_db
autumn_db.conn.connect('mysql', host=constants['mysql_host'], user=constants['mysql_user'], passwd=constants['mysql_password'], db=constants['mysql_database'], charset="utf8", use_unicode=True)
from models import base as models


remote_users = models.users_remote.get()[:]

for remote_user in remote_users:
  try:
    feed_response = urllib2.urlopen(remote_user.feed_url)
    feed_doc = BeautifulSoup(feed_response.read())
    remote_content.parse_feed(models, remote_user, feed_doc)
  except:
    pass
