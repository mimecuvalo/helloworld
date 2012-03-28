import os
import os.path

from base import BaseHandler
from logic import url_factory

class CustomizeHandler(BaseHandler):
  def get(self):
    if not self.authenticate(author=True):
      return

    self.display["user"] = self.get_author_user()

    static_path             = self.application.settings["static_path"]
    global_themes_directory = os.path.join(static_path, 'css/themes')
    local_themes_directory  = self.resource_directory('themes')
    local_themes_stem       = local_themes_directory[len(static_path) + 1:]

    self.display['themes'] = os.listdir(global_themes_directory)
    self.display['themes'] = [ os.path.join('css/themes', theme) for theme in self.display['themes'] if not theme.startswith('.') and theme.endswith('.css') ]

    if os.path.exists(local_themes_directory):
      local_themes = os.listdir(local_themes_directory)
      local_themes = [ os.path.join(local_themes_stem, theme) for theme in local_themes if not theme.startswith('.') and theme.endswith('.css') ]
      self.display['themes'] += local_themes

    self.display['currencies'] = [ "AUD", "CAD", "CZK", "DKK", "EUR", "HKD", "HUF", "ILS", "JPY", "MXN", "NOK", "NZD", "PLN", "GBP", "SGD", "SEK", "CHF", "THB", "USD", ]

    self.fill_template("customize.html")

  def post(self):
    if not self.authenticate(author=True):
      return

    user = self.get_author_user()

    user.title               = self.get_argument('title', '')
    user.description         = self.get_argument('description', '')
    user.oauth               = self.get_argument('oauth')
    user.name                = self.get_argument('name', '')
    user.favicon             = url_factory.clean_filename(self.get_argument('favicon', ''))
    user.currency            = self.get_argument('currency', '')
    user.theme               = url_factory.clean_filename(self.get_argument('theme', ''))
    user.background          = url_factory.clean_filename(self.get_argument('background', ''))
    user.logo                = url_factory.clean_filename(self.get_argument('logo', ''))
    user.google_analytics    = self.get_argument('google_analytics', '')
    user.adult_content       = self.get_argument('adult_content', 0) == 'on'
    user.tipjar              = self.get_argument('tipjar', '')
    user.sidebar_ad          = self.get_argument('sidebar_ad', '')
    user.newsletter_endpoint = self.get_argument('newsletter_endpoint', '')
    user.license             = self.get_argument('license', '')
    user.extra_code_top      = self.get_argument('extra_code_top', '')
    user.extra_code_bottom   = self.get_argument('extra_code_bottom', '')

    user.save()

    self.redirect(self.nav_url(section='dashboard'))
