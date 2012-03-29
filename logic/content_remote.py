import datetime
import json
import random
import re
import urllib2
import urlparse
from time import mktime

from BeautifulSoup import BeautifulSoup
import feedparser
import tornado.escape

from logic import users

# monkeypatch
feedparser._HTMLSanitizer.acceptable_elements = feedparser._HTMLSanitizer.acceptable_elements + ['iframe']

def parse_feed(models, user, feed=None, parsed_feed=None, max_days_old=30):
  feed_doc = feedparser.parse(parsed_feed or feed)

  for entry in feed_doc.entries:
    entry_id = entry.id if entry.has_key('id') else entry.link
    exists = models.content_remote.get(to_username=user.local_username, post_id=entry_id)[0]
    if exists:
      if entry.has_key('updated_parsed') and datetime.datetime.fromtimestamp(mktime(entry.updated_parsed)) != new_entry.date_updated:
        new_entry = exists
      else:
        continue
    else:
      new_entry = models.content_remote()

    new_entry.to_username = user.local_username
    new_entry.from_user = user.profile_url
    new_entry.username = user.username
    if entry.has_key('published_parsed'):
      parsed_date = datetime.datetime.fromtimestamp(mktime(entry.published_parsed))
    elif entry.has_key('updated_parsed'):
      parsed_date = datetime.datetime.fromtimestamp(mktime(entry.updated_parsed))
    else:
      parsed_date = datetime.datetime.now()

    if entry.has_key('updated_parsed'):
      updated_date = datetime.datetime.fromtimestamp(mktime(entry.updated_parsed))
    else:
      updated_date = parsed_date

    # we don't keep items that are over 30 days old
    if parsed_date < datetime.datetime.utcnow() - datetime.timedelta(days=max_days_old):
      continue

    new_entry.date_created = parsed_date
    new_entry.date_updated = updated_date
    new_entry.type = 'post'
    if entry.has_key('author'):
      new_entry.creator = entry.author
    new_entry.title = entry.title
    new_entry.post_id = entry_id
    new_entry.link = entry.link
    if entry.has_key('content'):
      new_entry.view = entry.content[0].value
    else:
      new_entry.view = entry.summary
    new_entry.save()

def sanitize(value):
  return feedparser._sanitizeHTML(value, 'UTF-8', 'text/html')

def get_remote_title_and_thumb(url, content_type=None):
  try:
    # XXX youtube doesn't like the scraping, too many captchas
    parsed_url = urlparse.urlparse(url)
    is_youtube = parsed_url.hostname.find('youtube.com') != -1

    title = ''
    image = ''
    html  = ''
    oembed_json = None

    if not is_youtube:
      opener = urllib2.build_opener()
      response = opener.open(url)
      info = response.info()
      if content_type is not None and 'content-type' in info and not info['content-type'].startswith(content_type):
        # save on bandwidth
        return ('', '', '')
      doc = BeautifulSoup(response.read())

      title_meta = doc.find('meta', property='og:title')
      image_meta = doc.find('meta', property='og:image')
      if title_meta and image_meta:
        title = title_meta['content']
        image = image_meta['content']

      oembed_link = doc.find('link', type='text/xml+oembed')
      if not oembed_link:
        oembed_link = doc.find('link', type='application/xml+oembed')
      if not oembed_link:
        oembed_json = doc.find('link', type='application/json+oembed')
    else:
      video_id = urlparse.parse_qs(parsed_url.query)['v'][0]
      oembed_link = { 'href': 'http://www.youtube.com/oembed?url=http%3A//www.youtube.com/watch?v%3D' + video_id + '&amp;format=xml' }

    if oembed_link:
      opener = urllib2.build_opener()
      # this is major bullshit. vimeo doesn't allow robot calls to oembed - who else is going to look at it??
      opener.addheaders = [('User-agent', 'Mozilla/5.0')]
      oembed = opener.open(oembed_link['href'])
      oembed_doc = BeautifulSoup(oembed.read())
      title = oembed_doc.find('title').string
      image = oembed_doc.find('thumbnail_url')
      if image:
        image = image.string
      raw_html = oembed_doc.find('html').string
      raw_html = raw_html.replace('&lt;![CDATA[', '').replace(']]&gt;', '')
      html = tornado.escape.xhtml_unescape(raw_html)

      if is_youtube:  # they serve up hqdefault for some reason...too big
        image = 'http://i' + str(random.randint(1, 4)) + '.ytimg.com/vi/' + video_id + '/default.jpg'
    elif oembed_json:
      # kickstarter, for example, only does json
      opener = urllib2.build_opener()
      oembed = opener.open(oembed_json['href'])
      oembed_data = json.loads(oembed.read().decode('utf8'))
      title = oembed_data['title']
      html = tornado.escape.xhtml_unescape(oembed_data['html'])

    return (title, image, html)
  except:
    pass

  return ('', '', '')
