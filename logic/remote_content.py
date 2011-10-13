import datetime
import re
from time import mktime

from BeautifulSoup import BeautifulSoup
import feedparser
import tornado.escape

from logic import users

def parse_feed(models, user, feed):
  feed_doc = feedparser.parse(feed)

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
