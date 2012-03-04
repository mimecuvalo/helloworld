import datetime
import random
import re
import urllib2
import urlparse
from time import mktime

from BeautifulSoup import BeautifulSoup
import feedparser
import tornado.escape

from logic import users

def parse_feed(models, user, feed=None, parsed_feed=None):
  feed_doc = feedparser.parse(parsed_feed or feed)

  for entry in feed_doc.entries:
    exists = models.content_remote.get(to_username=user.local_username, post_id=entry.id)[0]
    if exists:
      continue

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
    new_entry.date_created = parsed_date
    new_entry.type = 'post'
    if entry.has_key('author'):
      new_entry.creator = entry.author
    new_entry.title = entry.title
    new_entry.post_id = entry.id
    new_entry.link = entry.link
    if entry.has_key('content'):
      new_entry.view = entry.content[0].value
    else:
      new_entry.view = entry.summary
    new_entry.save()

def sanitize(value):
  return feedparser._sanitizeHTML(value, 'UTF-8', 'text/html')

def get_remote_title_and_thumb(url):
  try:
    # XXX youtube doesn't like the scraping, too many captchas
    parsed_url = urlparse.urlparse(url)
    is_youtube = parsed_url.hostname.find('youtube.com') != -1

    title = ''
    image = ''
    html  = ''

    if not is_youtube:
      response = urllib2.urlopen(url)
      doc = BeautifulSoup(response.read())

      title_meta = doc.find('meta', property='og:title')
      image_meta = doc.find('meta', property='og:image')
      if title_meta and image_meta:
        title = title_meta['content']
        image = image_meta['content']

      oembed_link = doc.find('link', type='text/xml+oembed')
    else:
      video_id = urlparse.parse_qs(parsed_url.query)['v'][0]
      oembed_link = { 'href': 'http://www.youtube.com/oembed?url=http%3A//www.youtube.com/watch?v%3D' + video_id + '&amp;format=xml' }

    if oembed_link:
      oembed = urllib2.urlopen(oembed_link['href'])
      oembed_doc = BeautifulSoup(oembed.read())
      title = oembed_doc.find('title').string
      image = oembed_doc.find('thumbnail_url').string
      html = tornado.escape.xhtml_unescape(oembed_doc.find('html').string)

      if is_youtube:  # they serve up hqdefault for some reason...too big
        image = 'http://i' + str(random.randint(1, 4)) + '.ytimg.com/vi/' + video_id + '/default.jpg'

    return (title, image, html)
  except:
    pass

  return ('', '', '')
