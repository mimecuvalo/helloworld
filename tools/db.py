import sys, os

sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) + '/../../'))
sys.path.insert(0, os.path.normpath(os.path.realpath(__file__) + '/../../packages'))

from logic import constants as constants_module

config = ConfigParser.ConfigParser()
config.read('../site.cfg')
constants = dict(constants_module.dictionary.items() + constants_module.dictionary.items() + config.items('general'))
for constant in constants:
  try:
    constants[constant] = int(constants[constant])
  except:
    pass

from autumn.db.connection import autumn_db
autumn_db.conn.connect('mysql', host=constants['mysql_host'], user=constants['mysql_user'], passwd=constants['mysql_password'], db=constants['mysql_database'], charset="utf8", use_unicode=True)
from models import base as models

comics_count = models.content.get(user=1, section='comic').count()
print models.content.get(user=1, section='comic')[comics_count-1:comics_count][0].name
