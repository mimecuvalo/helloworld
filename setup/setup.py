#!/usr/bin/env python

import os
import os.path
import cgi
import cgitb
cgitb.enable()
import urllib

prefix = os.environ['REQUEST_URI'][:os.environ['REQUEST_URI'].find(
    '/setup/setup.py')]
https_on = os.environ.has_key('HTTPS') and os.environ['HTTPS'] == 'on'
if https_on:
  protocol = 'https'
else:
  protocol = 'http'
url = protocol + '://' + os.environ['SERVER_NAME'] + prefix

htaccess_initial_path = os.path.normpath(os.path.realpath(__file__) +
    '/../../.htaccess-initial')
htaccess_path = os.path.normpath(os.path.realpath(__file__) +
    '/../../.htaccess')

if not os.path.exists(htaccess_path):
  htaccess_initial_file = open(htaccess_initial_path)
  htaccess_initial = htaccess_initial_file.read()
  htaccess_initial_file.close()

  htaccess = htaccess_initial.replace('$' + protocol.upper() +
      '_PREFIX', prefix)
  htaccess = htaccess.replace('$FULL_PATH_TO_SITE',
      os.path.normpath(os.path.realpath(__file__) + '/../../'))
  htaccess_file = open(htaccess_path, 'w')
  htaccess_file.write(htaccess)
  htaccess_file.close()

  url = url + '?prefix=' + urllib.quote_plus(prefix)

print """Content-type: text/html

<html>
  <head>
    <meta http-equiv="refresh" content="0;url=%s" />
  </head>
  <body>Finished writing .htaccess file...redirecting...</body>
</html>
""" % (url)
