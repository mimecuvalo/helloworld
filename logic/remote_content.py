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
    parsed_date = entry.published_parsed if entry.has_key('published_parsed') else entry.updated_parsed
    decoded_date = datetime.datetime.fromtimestamp(mktime(parsed_date))
    new_entry.date_created = decoded_date
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
  VALID_TAGS = ['a', 'abbr', 'acronym', 'address', 'audio', 'b', 'bdi', 'bdo',
                'big', 'blockquote', 'br', 'caption', 'center', 'cite', 'code',
                'col', 'colgroup', 'dd', 'del', 'details', 'dfn', 'div', 'dl',
                'dt', 'em', 'figcaption', 'figure', 'font', 'h1', 'h2', 'h3',
                'h4', 'h5', 'h6', 'hr', 'i', 'iframe', 'img', 'ins', 'kbd', 'li',
                'mark', 'meter', 'noscript', 'ol', 'p', 'pre', 'pre', 'progress',
                'q', 'rp', 'rt', 'ruby', 's', 'samp', 'small', 'source', 'span',
                'strike', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody',
                'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul', 'var', 'video', 'wbr']
  VALID_ATTRS = ['allowfullscreen', 'align', 'alt', 'border', 'cite', 'class', 'clear', 'controls', 'datetime', 'frameborder',
                 'height', 'href', 'hspace', 'rel', 'src', 'title', 'type', 'vspace', 'width']

  soup = BeautifulSoup(value)

  for tag in soup.findAll(True):
    if tag.name not in VALID_TAGS:
      tag.hidden = True
    elif tag.name == 'a':
      tag['rel'] = 'nofollow'
    for x in range(len(tag.attrs) - 1, -1, -1):
      if tag.attrs[x][0] not in VALID_ATTRS:
        del tag.attrs[x]

  # linkify
  for text in soup.findAll(text=True):
    if text.parent.name != 'a':
      text.replaceWith(tornado.escape.linkify(text, shorten=True, extra_params='rel="nofollow"'))
  return soup.renderContents()
