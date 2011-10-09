import os
import os.path

from base import BaseHandler
from logic import url_factory

class CustomizeHandler(BaseHandler):
  def get(self):
    if not self.authenticate(author=True):
      return

    self.display["user"] = self.get_author_user()

    self.display['themes'] = os.listdir(os.path.join(self.application.settings["static_path"], 'css/themes'))
    self.display['themes'] += os.listdir(self.resource_directory('themes'))
    self.display['themes'] = [ theme for theme in self.display['themes'] if not theme.startswith('.') and theme.endswith('.css') ]
    self.display['currencies'] = [ "AUD", "CAD", "CZK", "DKK", "EUR", "HKD", "HUF", "ILS", "JPY", "MXN", "NOK", "NZD", "PLN", "GBP", "SGD", "SEK", "CHF", "THB", "USD", ]

    self.fill_template("customize.html")

  def post(self):
    if not self.authenticate(author=True):
      return

    user = self.get_author_user()

    user.title = self.get_argument('title', '')
    user.description = self.get_argument('description', '')
    user.oauth = self.get_argument('oauth')
    user.name = self.get_argument('name', '')
    user.favicon = url_factory.clean_filename(self.get_argument('favicon', ''))
    user.currency = self.get_argument('currency', '')
    user.theme = url_factory.clean_filename(self.get_argument('theme', ''))
    user.background = url_factory.clean_filename(self.get_argument('background', ''))
    user.logo = url_factory.clean_filename(self.get_argument('logo', ''))
    user.google_analytics = self.get_argument('google_analytics', '')
    user.adult_content = self.get_argument('adult_content', 0) == 'on'
    user.tipjar = self.get_argument('tipjar', '')
    user.sidebar_ad = self.get_argument('sidebar_ad', '')
    user.newsletter_endpoint = self.get_argument('newsletter_endpoint', '')
    user.license = self.get_argument('license', '')

    user.save()

    self.redirect(self.nav_url(section='dashboard'))
