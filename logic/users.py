import base64
import datetime
import os
import os.path
import re
import urllib
import urllib2
import urlparse

from BeautifulSoup import BeautifulSoup
import Crypto.PublicKey.RSA as RSA
from Crypto.Util import number
import tornado.escape
import tornado.web

import content_remote
import magicsig
import pubsubhubbub_subscribe
import salmoning

def create_user(handler, username, email):
  if username == 'remote':
    raise tornado.web.HTTPError(400)

  user = handler.models.users()
  user.username = username
  user.name = username
  user.email = email
  user.superuser = False
  user.author = False
  user.theme = 'css/themes/pixel/_compiled_pixel.css'
  user.theme_title = 'pixel'
  user.theme_link = 'http://nightlight.ws'
  user.theme_author = 'nightlight'
  user.theme_author_link = 'http://nightlight.ws'

  key = RSA.generate(1024, os.urandom)
  n = base64.urlsafe_b64encode(number.long_to_bytes(key.n))
  e = base64.urlsafe_b64encode(number.long_to_bytes(key.e))
  d = base64.urlsafe_b64encode(number.long_to_bytes(key.d))
  user.magic_key = 'RSA.' + n + '.' + e
  user.private_key = d

  user.save()

  create_empty_content(handler, user.username, 'main', 'home', 'Hello, world.',
      template="feed", translate=True)
  create_empty_content(handler, user.username, 'main', 'photos', 'photos',
      template='album', translate=True)
  create_empty_content(handler, user.username, 'main', 'microblog',
      'microblog', template='feed', translate=True)
  create_empty_content(handler, user.username, 'main', 'reblogged',
      'reblogged', template='feed', translate=True)
  create_empty_content(handler, user.username, 'main', 'links', 'links',
      template='album', translate=True)
  create_empty_content(handler, user.username, 'main', 'about', 'about',
      view="I like turtles.", translate=True)
  create_empty_content(handler, user.username, 'main', 'comments', 'comments',
      translate=True, hidden=True)
  create_empty_content(handler, user.username, 'microblog', 'first', "first!",
      view="Hello, world.", translate=True)

  os.makedirs(os.path.join(handler.application.settings["private_path"],
      username))
  os.makedirs(os.path.join(os.path.join(
      handler.application.settings["resource_path"], username), 'themes'))

  # give a blog to follow
  user_remote = get_remote_user_info(handler, "http://kottke.org",
      username)
  user_remote.following = 1
  user_remote.save()

  # get some content, yo
  feed_response = urllib2.urlopen(user_remote.feed_url)
  content_remote.parse_feed(handler.models, user_remote, feed_response.read(),
      max_days_old=handler.constants['feed_max_days_old'])

  return user

def create_empty_content(handler, username, section, name, title,
    template=None, view=None, translate=False, hidden=False):
  content = handler.models.content()
  content.username = username
  content.section  = section
  content.name     = name
  content.date_created = datetime.datetime.utcnow()
  content.date_updated = datetime.datetime.utcnow()
  content.title = handler.locale.translate(title) if translate else title
  content.template = template
  content.hidden = hidden
  content.view = handler.locale.translate(view) if translate else view
  content.save()

def get_lrdd_link(url):
  parsed_url = urlparse.urlparse(url)
  host_meta_url = (parsed_url.scheme + '://' + parsed_url.hostname +
      '/.well-known/host-meta')
  #host_meta_url = 'http://localhost/statusnet2/.well-known/host-meta'
  host_meta_response = urllib2.urlopen(host_meta_url)
  host_meta_doc = BeautifulSoup(host_meta_response.read())
  lrdd_link = host_meta_doc.find('link', rel='lrdd')['template']

  return lrdd_link

def get_webfinger(lrdd, uri):
  webfinger_url = lrdd.replace('{uri}', urllib.quote_plus(uri))
  webfinger_response = urllib2.urlopen(webfinger_url)
  return BeautifulSoup(webfinger_response.read())

def salmon_common(handler):
  if handler.display.has_key('user'):
    user = handler.display["user"]
  else:
    user = handler.get_author_user()
    handler.display["user"] = user
  handler.display['feed'] = None
  handler.display["push_hub"] = handler.constants['push_hub']
  handler.display['utcnow'] = datetime.datetime.utcnow()
  handler.display["section"] = None
  handler.display["date_created"] = None
  handler.display["date_updated"] = None
  handler.display['activity_object'] = ''
  handler.display['activity_extra'] = ''
  handler.display['id'] = str(datetime.datetime.utcnow()).replace(' ', ':')
  return user

def salmon_follow(handler, salmon_url, follow=True):
  user = salmon_common(handler)
  action = 'follow' if follow else 'unfollow'
  handler.display['title'] = action
  handler.display['atom_content'] = action
  handler.display['activity_object'] = ''
  handler.display['verb'] = 'http://activitystrea.ms/schema/1.0/' + action
  atom_html = handler.render_string("feed.html", **handler.display)
  salmon_send(handler, user, salmon_url, atom_html)

def salmon_favorite(handler, salmon_url, post_id, favorite=True):
  user = salmon_common(handler)
  action = 'favorite' if favorite else 'unfavorite'
  handler.display['title'] = action
  handler.display['atom_content'] = action
  handler.display['verb'] = 'http://activitystrea.ms/schema/1.0/' + action
  handler.display['activity_object'] = """
    <activity:object-type>
      http://activitystrea.ms/schema/1.0/note
    </activity:object-type>
    <id>%(post_id)s</id>
    <title></title>
    <content type="html"></content>
    <!--<link href="http://freelish.us/notice/19245388" rel="alternate"
      type="text/html" />-->
""" % { 'post_id': post_id }
  atom_html = handler.render_string("feed.html", **handler.display)
  salmon_send(handler, user, salmon_url, atom_html)

def salmon_reply(handler, user_remote, content, thread=None,
    mentioned_users=[]):
  user = salmon_common(handler)
  handler.display['id'] = handler.content_url(content)
  handler.display['title'] = content.title
  handler.display['atom_content'] = content.view
  handler.display["date_created"] = content.date_created
  handler.display["date_updated"] = content.date_updated
  object_type = 'comment' if content.section == 'comments' else 'note'
  handler.display['verb'] = 'http://activitystrea.ms/schema/1.0/post'
  handler.display['activity_extra'] = """
    <activity:object-type>
      http://activitystrea.ms/schema/1.0/%(object_type)s
    </activity:object-type>
    <link href="%(content_url)s" rel="alternate" type="text/html" />""" % \
        { 'object_type': object_type,
          'content_url': handler.content_url(content, host=True), }

  for mentioned_user in mentioned_users:
    handler.display['activity_extra'] += """
    <link href="%(profile_url)s" rel="ostatus:attention" />
    <link href="%(profile_url)s" rel="mentioned" />
  """ % { 'profile_url': mentioned_user.profile_url }

  thread = thread or content.thread
  if thread:
    handler.display['activity_extra'] += """
        <thr:in-reply-to ref="%(thread)s" />""" % { 'thread': thread }
    #handler.display['activity_extra'] +=
    #    """<link rel="related" href="%(content_url)s"/>""" % \
    #    { 'content_url': handler.content_url(content, host=True) }
  if content.comments_count:
    handler.display['activity_extra'] += """
        <thr:replies type="application/atom+xml" href="%(url)s"
        count="%(count)s" updated="%(updated)s" />""" % \
        { 'url': handler.nav_url(host=True, username=content.username,
            section='feed', comments=handler.content_url(content)),
          'count': content.comments_count,
          'updated': content.comments_updated.strftime(
              '%Y-%m-%dT%H:%M:%S+00:00') }
  atom_html = handler.render_string("feed.html", **handler.display)
  salmon_send(handler, user, user_remote.salmon_url, atom_html)

class MockKeyRetriever(magicsig.KeyRetriever):
  def __init__(self, local_user):
    self.local_user = local_user
    self.signer_uri = None

  def LookupPublicKey(self, signer_uri=None):
    self.signer_uri = signer_uri
    return (str(self.local_user.magic_key + '.' + self.local_user.private_key))

def salmon_send(handler, user, salmon_url, text):
  salmonizer = salmoning.SalmonProtocol()
  salmonizer.key_retriever = MockKeyRetriever(local_user=user)
  env = salmonizer.SignSalmon(unicode(text, "utf8"), 'application/atom+xml',
      handler.nav_url(host=True, username=user.username))

  try:
    req = urllib2.Request(url=salmon_url,
        data=env,
        headers={ 'Content-Type': 'application/magic-envelope+xml' })
    
    urllib2.urlopen(req)
  except:
    pass

def webmention_reply(handler, user_remote, content, thread=None,
    mentioned_users=[]):
  if not user_remote.webmention_url:
    return

  target = thread or content.thread
  if not target:
    target = user_remote.profile_url

  env = {
    'source': handler.content_url(content, host=True),
    'target': target
  }

  try:
    req = urllib2.Request(url=user_remote.webmention_url,
        data=urllib.urlencode(env))
    urllib2.urlopen(req)
  except:
    pass

def get_remote_user_info(handler, user_url, profile):
  # get host-meta first
  lrdd_link = None
  try:
    lrdd_link = get_lrdd_link(user_url)
  except:
    pass
  salmon_url = ''
  webmention_url = ''
  magic_key = ''
  alias = ''
  webfinger_doc = None

  user_response = urllib2.urlopen(user_url)
  user_doc = BeautifulSoup(user_response.read())

  if not lrdd_link:
    atom_url = user_doc.find('link', rel=re.compile(r"\balternate\b"),
        type='application/atom+xml')
    rss_url = user_doc.find('link', rel=re.compile(r"\balternate\b"),
        type='application/rss+xml')

    feed_url = atom_url or rss_url
  else:
    # get webfinger
    try:
      webfinger_doc = get_webfinger(lrdd_link, user_url)
      feed_url = webfinger_doc.find('link',
          rel='http://schemas.google.com/g/2010#updates-from')
      salmon_url = webfinger_doc.find('link', rel='salmon')
      if salmon_url:
        salmon_url = salmon_url['href']
      webmention_url = webfinger_doc.find('link', rel='webmention')
      if webmention_url:
        webmention_url = webmention_url['href']
      magic_key = webfinger_doc.find('link', rel='magic-public-key')
      if magic_key:
        magic_key = magic_key['href'];
        magic_key = magic_key.replace('data:application/magic-public-key,', '')
      alias = webfinger_doc.find('alias')
      if alias:
        alias = alias.string
    except:
      feed_url = None

  if not webmention_url:
    webmention_url = user_doc.find('link', rel=re.compile(r"\bwebmention\b"))
    if webmention_url:
        webmention_url = webmention_url['href']

  if not feed_url:
    feed_url = user_url
  else:
    feed_url = feed_url['href']
  base_url = None

  if (not feed_url.startswith('/') and not (feed_url.startswith('http://') or
      feed_url.startswith('https://'))):
    base_url = user_doc.find('base')
    if base_url:
      base_url = base_url['href']
    else:
      base_url = ''
    feed_url = base_url + feed_url

  parsed_url = urlparse.urlparse(user_url)
  if not (feed_url.startswith('http://') or feed_url.startswith('https://')):
    if (not feed_url.startswith('/')):
      feed_url = '/' + feed_url
    feed_url = parsed_url.scheme + '://' + parsed_url.hostname + feed_url

  feed_response = urllib2.urlopen(feed_url)
  feed_doc = BeautifulSoup(feed_response.read())
  author = feed_doc.find('author')

  alias = None
  if author:
    uri = author.find('uri')
    if uri:
      alias = uri.string  # alias or user_url

  if not alias:
    alt_link = feed_doc.find('link', rel=re.compile(r"\balternate\b"))
    if alt_link:
      alias = alt_link['href']
    else:
      # XXX UGH, BeautifulSoup treats <link> as self-closing tag
      # LAMESAUCE for rss
      alias = feed_doc.find('link').nextSibling
  if not alias or not alias.strip():
    raise tornado.web.HTTPError(400)

  alias = alias.strip()
  user_remote = handler.models.users_remote.get(local_username=profile,
      profile_url=alias)[0]
  hub_url = feed_doc.find(re.compile('.+:link$'), rel='hub')

  if not user_remote:
    user_remote = handler.models.users_remote()

  favicon = None
  favicon = user_doc.find('link', rel='shortcut icon')
  if favicon:
    if (favicon['href'].startswith('http://') or
        favicon['href'].startswith('https://')):
      favicon = favicon['href']
    else:
      if base_url:
        favicon = base_url + favicon['href']
      else:
        favicon = (parsed_url.scheme + '://' + parsed_url.hostname +
            ('' if favicon['href'].startswith('/') else '/') + favicon['href'])
  else:
    favicon = parsed_url.scheme + '://' + parsed_url.hostname + '/favicon.ico'
  user_remote.favicon = favicon

  user_remote.local_username = profile
  logo = feed_doc.find('logo')
  if logo and logo.parent.name == 'source':
    logo = None
  image = feed_doc.find('image')
  if logo:
    user_remote.avatar = logo.string
  elif image:
    image = feed_doc.find('image')
    url = image.find('url')
    user_remote.avatar = url.string
  else:
    user_remote.avatar = favicon

  if not favicon:
    user_remote.favicon = user_remote.avatar

  preferred_username = None
  display_name = None
  if author:
    preferred_username = author.find(re.compile('.+:preferredusername$'))
    display_name = author.find(re.compile('.+:displayname$'))
  if author and preferred_username and display_name:
    #user_remote.avatar = author.find('link', rel='avatar')['href']
    user_remote.username = preferred_username.string
    user_remote.name = display_name.string
  elif webfinger_doc:
    user_remote.username = webfinger_doc.find('Property',
        type="http://apinamespace.org/atom/username").string
  else:
    user_remote.username = feed_doc.find('title').string
  user_remote.profile_url = alias
  user_remote.magic_key = magic_key
  user_remote.salmon_url = salmon_url
  user_remote.webmention_url = webmention_url
  user_remote.feed_url = feed_url
  if hub_url:
    user_remote.hub_url = hub_url['href']
  user_remote.save()

  try:
    # TODO(mime): Add hub.secret
    if user_remote.hub_url:
      callback_url = handler.nav_url(host=True, username=profile,
          section='push')
      pubsubhubbub_subscribe.subscribe_topic(user_remote.hub_url,
          user_remote.feed_url, callback_url, verify="sync")
  except:
    import logging
    logging.error("couldn't subscribe on the hub!")

  return user_remote
