import datetime
import re
from autumn import validators

class Path(validators.Regex):
  regex = re.compile(r'^/.*$', re.I | re.U)

class Alphanumeric(validators.Regex):
  regex = re.compile(r'^\w*$', re.I | re.U)

class Id(validators.Regex):
  regex = re.compile(r'^[\w-]+$', re.I | re.U)

class IdOrNull(validators.Regex):
  regex = re.compile(r'^[\w-]*$', re.I | re.U)

class Datetime(validators.Validator):
  def __call__(self, dt):
    return type(dt) is datetime.datetime

class DatetimeOrNull(validators.Validator):
  def __call__(self, dt):
    return dt is None or type(dt) is datetime.datetime

class Boolean(validators.Validator):
  def __call__(self, boolean):
    return ((type(boolean) is int and (boolean == 0 or boolean == 1)) or
        type(boolean) is bool)

class UnicodeString(validators.Validator):
  def __init__(self, min_length=1, max_length=None):
    if max_length is not None:
      assert max_length >= min_length, "max_length must be >= to min_length"
    self.min_length = min_length
    self.max_length = max_length
        
  def __call__(self, string):
    l = len(string)
    return (l >= self.min_length) and \
           (self.max_length is None or l <= self.max_length)
