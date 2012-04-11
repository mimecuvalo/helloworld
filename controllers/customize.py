import os
import os.path
import re

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
          self.display['themes'].append({ 'path': os.path.join(local_themes_stem, os.path.join(theme, theme + '.css')) })

    local_themes = os.listdir(global_themes_directory)
    for theme in local_themes:
      theme_path = os.path.join(global_themes_directory, theme)
      css_path = os.path.join(theme_path, theme + '.css')
      if not theme.startswith('.') and os.path.isdir(theme_path) and os.path.exists(css_path):
        self.display['themes'].append({ 'path': os.path.join('css/themes', os.path.join(theme, theme + '.css')) })

    for theme in self.display['themes']:
      f = open(os.path.join(static_path, theme['path']))
      theme_data = f.read()
      title = re.search(r'\* theme: (.*)(\s\(|$)', theme_data)
      theme['title'] = title.group(1) if title and len(title.groups()) > 1 else ''
      link = re.search(r'\* theme: .*\((.*)\)', theme_data)
      theme['link'] = link.group(1) if link and len(link.groups()) > 0 else ''
      author = re.search(r'\* designed_by: (.*)(\s\(|$)', theme_data)
      theme['author'] = author.group(1) if author and len(author.groups()) > 1 else ''
      author_link = re.search(r'\* designed_by: .*\((.*)\)', theme_data)
      theme['author_link'] = author_link.group(1) if author_link and len(author_link.groups()) > 0 else ''
      theme['thumb'] = os.path.join(os.path.dirname(theme['path']), 'thumb.png')

      options = re.findall(r'\* ((?:color|font|image|if|text).*)', theme_data, re.M)
      for index, option in enumerate(options):
        theme['option_' + str(index)] = option

      extra_head_html = re.search(r'\* extra_head_html: """(.*?)"""', theme_data, re.M | re.DOTALL)
      theme['extra_head_html'] = extra_head_html.group(1).replace('\n', '\\n') if extra_head_html and len(extra_head_html.groups()) > 0 else ''
      extra_body_end_html = re.search(r'\* extra_body_end_html: """(.*?)"""', theme_data, re.M | re.DOTALL)
      theme['extra_body_end_html'] = extra_body_end_html.group(1).replace('\n', '\\n') if extra_body_end_html and len(extra_body_end_html.groups()) > 0 else ''

      if self.display["user"].theme.replace('_compiled_', '') == theme['path']:
        self.display['user_theme'] = theme

      f.close()

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
    user.theme_title         = self.get_argument('theme_title', '')
    user.theme_link          = self.get_argument('theme_link', '')
    user.theme_author        = self.get_argument('theme_author', '')
    user.theme_author_link   = self.get_argument('theme_author_link', '')
    user.extra_head_html     = self.get_argument('extra_head_html', '').replace('\\n', '\n')
    user.extra_body_end_html = self.get_argument('extra_body_end_html', '').replace('\\n', '\n')
    user.logo                = url_factory.clean_filename(self.get_argument('logo', ''))
    user.google_analytics    = self.get_argument('google_analytics', '')
    user.adult_content       = int(self.get_argument('adult_content', 0))
    user.tipjar              = self.get_argument('tipjar', '')
    user.sidebar_ad          = self.get_argument('sidebar_ad', '')
    user.newsletter_endpoint = self.get_argument('newsletter_endpoint', '')
    user.license             = self.get_argument('license', '')

    user.save()

    self.set_status(204)
