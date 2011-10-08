import datetime
import re

from BeautifulSoup import BeautifulSoup
import tornado.escape

from logic import users

def parse_feed(models, user, feed_doc):
  try:
    entries = feed_doc.findAll('entry') # atom
    if len(entries) == 0:
      entries = feed_doc.findAll('item')  # rss
    entries.reverse()

    for entry in entries:
      post_id = entry.find('id')
      if not post_id:
        post_id = entry.find('guid')
      exists = models.content_remote.get(to_username=user.local_username, post_id=post_id.string)[0]
      if exists:
        continue

      new_entry = models.content_remote()      
      new_entry.to_username = user.local_username
      new_entry.from_user = user.profile_url
      new_entry.username = user.username
      date = entry.find('updated')
      if date:
        decoded_date = datetime.datetime.strptime(date.string[:-6], '%Y-%m-%dT%H:%M:%S')
      else:
        date = entry.find('pubdate')
        decoded_date = datetime.datetime.strptime(date.string[:-4], '%a, %d %b %Y %H:%M:%S')
      new_entry.date_created = decoded_date
      new_entry.type = 'post'
      creator = entry.find('dc:creator')
      if creator:
        new_entry.creator = creator.string
      new_entry.title = entry.find('title').string
      new_entry.post_id = post_id.string
      if entry.find('link').has_key('href'):
        new_entry.link = entry.find('link')['href']
      else:
        new_entry.link = entry.find('link').nextSibling # XXX UGH, BeautifulSoup treats <link> as self-closing tag, LAMESAUCE for rss
      content = entry.find(re.compile('^content:?.*')).text
      new_entry.view = sanitize(tornado.escape.xhtml_unescape(content))
      new_entry.save()
  except:
    pass

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
