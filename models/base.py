from autumn.model import Model
from autumn import validators
from autumn.db.relations import ForeignKey

import validators as custom_validators

class content(Model):
  #user = ForeignKey('users')

  class Meta:
    defaults = {'count': 0,
                'count_robot': 0,
                'favorites': 0,
                'shares': 0,
                'comments_count': 0,
                'comments_updated': None,
                'order': 0,
                'album': '',
                'thumb': '',
                'style': '',
                'title': '',
                'price': 0.00,
                'date_start': None,
                'date_end': None,
                'date_repeats': 0,
                'template': '',
                'sort_type': '',
                'redirect': 0,
                'forum': 0,
                'hidden': 0,
                'favorited': 0,
                'is_spam': 0,
                'deleted': 0,
                'thread': '',
                'thread_user': '',
                'avatar': '',
                'view': '',
                'code': '',}
    validations = {'section': (custom_validators.UnicodeString(1, 255),
                               custom_validators.Id()),
                   'album': (custom_validators.UnicodeString(0, 255),
                             custom_validators.IdOrNull()),
                   'name': (custom_validators.UnicodeString(1, 255),
                            custom_validators.Id()),
                   'username': (custom_validators.UnicodeString(1, 255),
                                custom_validators.Alphanumeric()),
                   'date_created': custom_validators.Datetime(),
                   'date_updated': custom_validators.Datetime(),
                   'date_start': custom_validators.DatetimeOrNull(),
                   'date_end': custom_validators.DatetimeOrNull(),
                   'date_repeats': validators.Number(),
                   'count': validators.Number(),
                   'count_robot': validators.Number(),
                   'favorites': validators.Number(),
                   'shares': validators.Number(),
                   'comments_count': validators.Number(),
                   'price': validators.Number(),
                   'hidden': custom_validators.Boolean(),
                  }

class content_remote(Model):
  class Meta:
    defaults = {'type': '',
                'from_user': '',
                'local_content_name': '',
                'username': '',
                'creator': '',
                'title': '',
                'post_id': '',
                'read': '0',
                'is_spam': 0,
                'favorited': 0,
                'deleted': 0,
                'date_updated': None,
                'comments_count': 0,
                'comments_updated': None,
                'thread': '',
                'avatar': '',
                'link': '',
                'view': '',}
    validations = {'to_username': (custom_validators.UnicodeString(1, 255),
                                   custom_validators.Alphanumeric()),
                   'type': validators.String(),
                   'date_created': custom_validators.Datetime(),
                   'date_updated': custom_validators.DatetimeOrNull(),
                   'comments_count': validators.Number(),
                   'comments_updated': custom_validators.DatetimeOrNull(),
                  }

"""
class content_access(Model):
  content = ForeignKey('content')
  user = ForeignKey('users')

  class Meta:
    defaults = {'has_access': 1}
    validations = {'content': validators.Number(),
                   'user': validators.Number(),
                   'has_access': validators.Number(),
                  }

class resource_access(Model):
  user = ForeignKey('users')

  class Meta:
    defaults = {'has_access': 1}
    validations = {'url': custom_validators.Path(),
                   'user': validators.Number(),
                   'has_access': validators.Number(),
                  }
"""

class users(Model):
  class Meta:
    defaults = {'title': '',
                'description': '',
                'hostname': '',
                'name': '',
                'google_analytics': '',
                'license': '',
                'tipjar': '',
                'sidebar_ad': '',
                'currency': '',
                'newsletter_endpoint': '',
                'favicon': '',
                'theme': '',
                'logo': '',
                'magic_key': '',
                'extra_head_html': '',
                'extra_body_end_html': '',
                'theme_title': '',
                'theme_link': '',
                'theme_author': '',
                'theme_author_link': '',
                'adult_content': 0,
                'twitter': '',
                'facebook': '',
                'google': '',
                'tumblr': '',}
    validations = {'username': (custom_validators.UnicodeString(1, 255),
                                custom_validators.Alphanumeric()),
                   'name': custom_validators.UnicodeString(0, 255),
                   'email': validators.String(1, 255),
                   'author': custom_validators.Boolean(),
                   'superuser': custom_validators.Boolean(),
                   'title': custom_validators.UnicodeString(0, 255),
                   'adult_content': custom_validators.Boolean(),
                   'magic_key': validators.String(),
                   'private_key': validators.String(),
                  }

class users_remote(Model):
  class Meta:
    defaults = {'username': '',
                'name': '',
                'order': 0,
                'magic_key': '',
                'avatar': '',
                'favicon': '',
                'salmon_url': '',
                'webmention_url': '',
                'hub_url': '',
                'feed_url': '',
                'sort_type': '',
                'follower': 0,
                'following': 0, }
    validations = {'local_username': (custom_validators.UnicodeString(1, 255),
                                      custom_validators.Alphanumeric()),
                   'username': custom_validators.UnicodeString(0, 255),
                   'name': custom_validators.UnicodeString(0, 255),
                   'profile_url': validators.String(),
                   'follower': custom_validators.Boolean(),
                   'following': custom_validators.Boolean(),
                  }
