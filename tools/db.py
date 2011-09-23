import sys, os

sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) + '/../../'))
sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) + '/../../packages'))

from logic import constants as constants_module

config = ConfigParser.ConfigParser()
config.read('../site.cfg')
constants = dict(constants_module.dictionary.items() + config.items('general') + config.items('advanced'))
for constant in ('debug', 'port', 'page_size', 'single_user_site', 'ioloop'):
  constants[constant] = int(constants[constant])

from autumn.db.connection import autumn_db
autumn_db.conn.connect('mysql', host=constants['mysql_host'], user=constants['mysql_user'], passwd=constants['mysql_password'], db=constants['mysql_database'])
from models import base as models

comics_count = models.content.get(user=1, section='comic').count()
print models.content.get(user=1, section='comic')[comics_count-1:comics_count][0].name
