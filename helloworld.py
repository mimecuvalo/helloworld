#!/usr/bin/env python

import sys, os
if sys.version < "2.6":
  os.execl("/usr/local/bin/python2.6", "python2.6", *sys.argv)

import ConfigParser
import logging
import threading

sys.path.insert(0, os.path.join(os.path.dirname(os.path.realpath(__file__)),
    "packages"))

import tornado.escape
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.template
import tornado.web
import tornado.wsgi
from tornado.options import define, options

import controllers.uimodules
from logic import constants as constants_module
from logic import cache

# setup site.cfg
setup = False
config_path = os.path.join(os.path.dirname(os.path.realpath(__file__)),
    "site.cfg")
if not os.path.exists(config_path):
  setup = True
  constants = dict(constants_module.dictionary.items() +
      constants_module.defaults.items())
else:
  config = ConfigParser.ConfigParser()
  config.read(config_path)
  constants = dict(constants_module.dictionary.items() +
      constants_module.defaults.items() + config.items('general'))
  for constant in constants:
    try:
      constants[constant] = int(constants[constant])
    except:
      pass

define("port", default=constants['port'], type=int, help="Port to listen on.")
define("debug", default=constants['debug'], type=int,
    help="Run in debug mode.")

if constants['debug']:
  logging_level = logging.DEBUG
else:
  logging_level = logging.INFO
logging.basicConfig(level=logging_level,
    format='%(asctime)s %(levelname)s %(message)s',
    filename=(os.path.join(os.path.dirname(os.path.realpath(__file__)),
        "server.log")))

tornado.options.parse_command_line()
tornado.locale.load_translations(os.path.join(os.path.dirname(__file__),
    "translations"))

settings = {
  "constants": constants,
  "base_path": os.path.dirname(os.path.realpath(__file__)),
  "private_path": os.path.join(os.path.dirname(os.path.realpath(__file__)),
      "private"),
  "resource_path": os.path.join(os.path.dirname(os.path.realpath(__file__)),
      "static/resource"),
  "cache_path": os.path.join(os.path.dirname(os.path.realpath(__file__)),
      "static/cache"),
  "update_feeds_path":
      os.path.join(os.path.dirname(os.path.realpath(__file__)),
          "tools/update_feeds.py"),
  "prune_entries_path":
      os.path.join(os.path.dirname(os.path.realpath(__file__)),
          "tools/prune_old_entries.py"),
  "restart_path": os.path.join(os.path.dirname(os.path.realpath(__file__)),
      "tmp/restart.txt"),
  "app_path": os.path.realpath(__file__),
  "resource_url": "static/resource",
  "static_path": os.path.join(os.path.dirname(os.path.realpath(__file__)),
      "static"),
  "static_url": "static",
  "config_path": config_path,
  "login_url": "/login",
  "xsrf_cookies": True,
  "debug": (options.debug == 1),
  "ui_modules": controllers.uimodules,
  "cookie_secret": constants['xsrf_secret'],
  "template_loader":
      tornado.template.Loader(os.path.join(os.path.dirname(
          os.path.realpath(__file__)), "templates")),
  "db_lock": threading.Lock(),
  "twitter_consumer_key": constants['twitter_consumer_key'],
  "twitter_consumer_secret": constants['twitter_consumer_secret'],
  "google_api_key": constants['google_api_key'],
  "google_secret": constants['google_secret'],
  "facebook_api_key": constants['facebook_api_key'],
  "facebook_secret": constants['facebook_secret'],
  "tumblr_consumer_key": constants['tumblr_consumer_key'],
  "tumblr_consumer_secret": constants['tumblr_consumer_secret'],
}

prefix = r"(?:" + tornado.escape.url_escape(
    constants['https_prefix']).replace('%2F', '/') + r")?"
prefix += r"(?:" + tornado.escape.url_escape(
    constants['http_prefix']).replace('%2F', '/') + r")?"

if not constants['ioloop'] and not constants['use_mod_rails']:
  prefix += r"/helloworld.py"

if setup:
  handlers = [
    (r".*", "controllers.setup.SetupHandler"),
  ]
  settings["xsrf_cookies"] = False
else:
  handlers = [ ]
  for source in constants['external_sources']:
    handlers += [ (prefix + "/" + source, "controllers." + source + "." +
        source.capitalize() + "Handler") ]

  handlers += [
    (prefix + r"/\.well-known/host-meta",
        "controllers.host_meta.HostMetaHandler"),
    (prefix + r"/admin(?:$|/.*)",
        "controllers.dashboard.DashboardHandler"), # for WP users :P
    (prefix + r"/api", "controllers.api.ApiHandler"),
    (prefix + r"/check_broken_links",
        "controllers.check_broken_links.CheckBrokenLinksHandler"),
    (prefix + r"/customize", "controllers.customize.CustomizeHandler"),
    (prefix + r"/dashboard(?:$|/.*)",
        "controllers.dashboard.DashboardHandler"),
    (prefix + r"/data_liberation",
        "controllers.data_liberation.DataLiberationHandler"),
    (prefix + r"/data_liberation\.zip",
        "controllers.data_liberation.DataLiberationDownloadHandler",
        {"path": "/tmp"}),
    (prefix + r"/(favicon\.ico)", tornado.web.StaticFileHandler,
        {"path": settings['static_path']}),
    (prefix + r"(?:/[^/]+)?/feed", "controllers.feed.FeedHandler"),
    (prefix + r"(?:/[^/]+)?/foaf", "controllers.foaf.FoafHandler"),
    (prefix + r"/(humans\.txt)", "controllers.humans.HumansTxtHandler",
        {"path": settings['static_path']}),
    (prefix + r"/login", "controllers.auth.AuthHandler"),
    (prefix + r"/logout", "controllers.auth.AuthLogoutHandler"),
    (prefix + r"/media", "controllers.media.MediaHandler"),
    (prefix + r"/oembed", "controllers.oembed.OembedHandler"),
    (prefix + r"(?:/[^/]+)?/opensearch",
        "controllers.opensearch.OpenSearchHandler"),
    (prefix + r"/private/(.*)", "controllers.private.PrivateResourceHandler",
        {"path": settings['private_path']}),
    (prefix + r"(?:/[^/]+)?/push", "controllers.push.PushHandler"),
    (prefix + r"/restart", "controllers.restart.RestartHandler"),
    (prefix + r"/(robots\.txt)", tornado.web.StaticFileHandler,
        {"path": settings['static_path']}),
    (prefix + r"/salmon(?:$|/.*)", "controllers.salmon.SalmonHandler"),
    (prefix + r"(?:/[^/]+)?/search(?:$|/.*)",
        "controllers.search.SearchHandler"),
    (prefix + r"/stats", "controllers.stats.StatsStaticHandler",
        {"path": "./static"}),
    (prefix + r"/upload", "controllers.upload.UploadHandler"),
    (prefix + r"/users(?:$|/.*)", "controllers.users.UsersHandler"),
    (prefix + r"/webfinger(?:$|/.*)",
        "controllers.webfinger.WebfingerHandler"),
    (prefix + r"/webmention(?:$|/.*)",
        "controllers.webmention.WebmentionHandler"),
    (r".*", "controllers.view.ViewHandler"),
  ]

# add cache_invalidate to crontab
try:
  cache_script = 'rm -rf ' + settings['cache_path']
  cache_cron_line = '0 5 * * * ' + cache_script
  f = os.popen('crontab -l')
  crontab = f.readlines()
  if (cache_cron_line + '\n') not in crontab:
    os.system('(crontab -l ; echo "' + cache_cron_line + '") | crontab -')

  update_feeds_script = 'python ' + settings['update_feeds_path']
  update_feed_line = '0 1 * * * ' + update_feeds_script
  if (update_feed_line + '\n') not in crontab:
    os.system('(crontab -l ; echo "' + update_feed_line + '") | crontab -')

  prune_feeds_script = 'python ' + settings['prune_entries_path']
  prune_feed_line = '0 9 * * * ' + prune_feeds_script
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
    fastcgi.runfastcgi(application, method="threaded", pidfile="hello.pid",
        daemonize="false")
