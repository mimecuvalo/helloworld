#!/usr/bin/env python

import ConfigParser
import logging
import sys, os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)), "packages"))

import tornado.escape
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.template
import tornado.web
import tornado.wsgi
from tornado.options import define, options

import controllers.admin
import controllers.api
import controllers.auth
import controllers.check_broken_links
import controllers.customize
import controllers.dashboard
import controllers.data_liberation
import controllers.feed
import controllers.foaf
import controllers.host_meta
import controllers.humans
import controllers.media
import controllers.opensearch
import controllers.private
import controllers.push
import controllers.salmon
import controllers.search
import controllers.setup
import controllers.stats
import controllers.uimodules
import controllers.upload
import controllers.view
import controllers.webfinger
from logic import constants as constants_module
from logic import cache

# setup site.cfg
setup = False
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "site.cfg")
if not os.path.exists(config_path):
  setup = True
  constants = dict(constants_module.dictionary.items() + constants_module.defaults.items())
else:
  config = ConfigParser.ConfigParser()
  config.read(config_path)
  constants = dict(constants_module.dictionary.items() + config.items('general'))
  for constant in ('debug', 'http_hide_prefix', 'port', 'page_size', 'single_user_site', 'ioloop', 'use_mod_rails'):
    constants[constant] = int(constants[constant])

define("port", default=constants['port'], type=int, help="Port to listen on.")
define("debug", default=constants['debug'], type=int, help="Run in debug mode.")

if constants['debug']:
  logging_level = logging.DEBUG
else:
  logging_level = logging.INFO
logging.basicConfig(level=logging_level, format='%(asctime)s %(levelname)s %(message)s', filename=(os.path.join(os.path.dirname(os.path.realpath(__file__)), "server.log")))

tornado.options.parse_command_line()
tornado.locale.load_translations(os.path.join(os.path.dirname(__file__), "translations"))

settings = {
  "constants": constants,
  "private_path": os.path.join(os.path.dirname(os.path.realpath(__file__)), "private"),
  "resource_path": os.path.join(os.path.dirname(os.path.realpath(__file__)), "static/resource"),
  "cache_path": os.path.join(os.path.dirname(os.path.realpath(__file__)), "static/cache"),
  "update_feeds_path": os.path.join(os.path.dirname(os.path.realpath(__file__)), "tools/update_feeds.py"),
  "prune_entries_path": os.path.join(os.path.dirname(os.path.realpath(__file__)), "tools/prune_old_entries.py"),
  "app_path": os.path.realpath(__file__),
  "resource_url": "static/resource",
  "static_path": os.path.join(os.path.dirname(os.path.realpath(__file__)), "static"),
  "config_path": config_path,
  "login_url": "/login",
  "xsrf_cookies": True,
  "debug": (options.debug == 1),
  "ui_modules": controllers.uimodules,
  "cookie_secret": constants['xsrf_secret'],
  "template_loader": tornado.template.Loader(os.path.join(os.path.dirname(os.path.realpath(__file__)), "templates")),
}

prefix = r"(?:" + tornado.escape.url_escape(constants['https_prefix']).replace('%2F', '/') + r")?"
prefix += r"(?:" + tornado.escape.url_escape(constants['http_prefix']).replace('%2F', '/') + r")?"

if not constants['ioloop'] and not constants['use_mod_rails']:
  prefix += r"/helloworld.py"

if setup:
  handlers = [
    (r".*", controllers.setup.SetupHandler),
  ]
  settings["xsrf_cookies"] = False
else:
  handlers = [
    (prefix + r"/\.well-known/host-meta", controllers.host_meta.HostMetaHandler),
    (prefix + r"/admin(?:$|/.*)", controllers.admin.AdminHandler),
    (prefix + r"/api", controllers.api.ApiHandler),
    (prefix + r"/check_broken_links", controllers.check_broken_links.CheckBrokenLinksHandler),
    (prefix + r"/customize", controllers.customize.CustomizeHandler),
    (prefix + r"/dashboard(?:$|/.*)", controllers.dashboard.DashboardHandler),
    (prefix + r"/data_liberation", controllers.data_liberation.DataLiberationHandler),
    (prefix + r"/data_liberation\.zip", controllers.data_liberation.DataLiberationDownloadHandler, {"path": "/tmp"}),
    (prefix + r"/?[^/]+/feed", controllers.feed.FeedHandler),
    (prefix + r"/?[^/]+/foaf", controllers.foaf.FoafHandler),
    (prefix + r"/(humans\.txt)", controllers.humans.HumansTxtHandler, {"path": settings['static_path']}),
    (prefix + r"/login", controllers.auth.AuthHandler),
    (prefix + r"/logout", controllers.auth.AuthLogoutHandler),
    (prefix + r"/media", controllers.media.MediaHandler),
    (prefix + r"/?[^/]+/opensearch", controllers.opensearch.OpenSearchHandler),
    (prefix + r"/private/(.*)", controllers.private.PrivateResourceHandler, {"path": settings['private_path']}),
    (prefix + r"/?[^/]+/push", controllers.push.PushHandler),
    (prefix + r"/(robots\.txt)", tornado.web.StaticFileHandler, {"path": settings['static_path']}),
    (prefix + r"/salmon(?:$|/.*)", controllers.salmon.SalmonHandler),
    (prefix + r"/?[^/]+/search", controllers.search.SearchHandler),
    (prefix + r"/stats", controllers.stats.StatsStaticHandler, {"path": "./static"}),
    (prefix + r"/upload", controllers.upload.UploadHandler),
    (prefix + r"/webfinger(?:$|/.*)", controllers.webfinger.WebfingerHandler),
    (r".*", controllers.view.ViewHandler),
  ]

# add cache_invalidate to crontab
try:
  cache_script = 'rm -rf ' + settings['cache_path']
  cache_cron_line = '0 2 * * * ' + cache_script
  f = os.popen('crontab -l')
  crontab = f.readlines()
  if (cache_cron_line + '\n') not in crontab:
    os.system('(crontab -l ; echo "' + cache_cron_line + '") | crontab -')

  update_feeds_script = 'python ' + settings['update_feeds_path']
  update_feed_line = '0 * * * * ' + update_feeds_script
  if (update_feed_line + '\n') not in crontab:
    os.system('(crontab -l ; echo "' + update_feed_line + '") | crontab -')

  prune_feeds_script = 'python ' + settings['prune_entries_path']
  prune_feed_line = '0 2 * * * ' + prune_feeds_script
  if (prune_feed_line + '\n') not in crontab:
    os.system('(crontab -l ; echo "' + prune_feed_line + '") | crontab -')
except:
  pass

if constants['ioloop']:
  application = tornado.web.Application(handlers, **settings)
  http_server = tornado.httpserver.HTTPServer(application)
  http_server.listen(options.port)
  tornado.ioloop.IOLoop.instance().start()
else:
  application = tornado.wsgi.WSGIApplication(handlers, **settings)
  if not constants['use_mod_rails']:
    from tools import fastcgi
    fastcgi.runfastcgi(application, method="threaded", pidfile="hello.pid", daemonize="false")
