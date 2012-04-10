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
    local_themes_directory  = url_factory.resource_directory(self, 'themes')
    local_themes_stem       = local_themes_directory[len(static_path) + 1:]

    self.display['themes'] = []
    if os.path.exists(local_themes_directory):
      local_themes = os.listdir(local_themes_directory)
      for theme in local_themes:
        theme_path = os.path.join(local_themes_directory, theme)
        css_path = os.path.join(theme_path, theme + '.css')
        if not theme.startswith('.') and os.path.isdir(theme_path) and os.path.exists(css_path):
          self.display['themes'].append(os.path.join(local_themes_stem, os.path.join(theme, theme + '.css')))

    local_themes = os.listdir(global_themes_directory)
    for theme in local_themes:
      theme_path = os.path.join(global_themes_directory, theme)
      css_path = os.path.join(theme_path, theme + '.css')
      if not theme.startswith('.') and os.path.isdir(theme_path) and os.path.exists(css_path):
        self.display['themes'].append(os.path.join('css/themes', os.path.join(theme, theme + '.css')))

    self.display['currencies'] = [ "AUD", "CAD", "CZK", "DKK", "EUR", "HKD", "HUF", "ILS", "JPY", \
                                   "MXN", "NOK", "NZD", "PLN", "GBP", "SGD", "SEK", "CHF", "THB", "USD", ]

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
    user.adult_content       = int(self.get_argument('adult_content', 0))
    user.tipjar              = self.get_argument('tipjar', '')
    user.sidebar_ad          = self.get_argument('sidebar_ad', '')
    user.newsletter_endpoint = self.get_argument('newsletter_endpoint', '')
    user.license             = self.get_argument('license', '')

    user.save()

    self.set_status(204)
