import datetime

import tornado.escape

from logic import users

def parse_feed(models, user, feed_doc):
  try:
    entries = feed_doc.findAll('entry')
    entries.reverse()

    for entry in entries:
      exists = models.content_remote.get(to_username=user.local_username, post_id=entry.find('id').string)[0]
      if exists:
        continue

      new_entry = models.content_remote()      
      new_entry.to_username = user.local_username
      new_entry.from_user = user.profile_url
      new_entry.username = user.username
      new_entry.date_created = datetime.datetime.strptime(entry.find('updated').string[:-6], '%Y-%m-%dT%H:%M:%S')
      new_entry.type = 'post'
      new_entry.title = users.sanitize(tornado.escape.xhtml_unescape(entry.find('title').string))
      new_entry.post_id = entry.find('id').string
      new_entry.link = entry.find('link')['href']
      new_entry.view = users.sanitize(tornado.escape.xhtml_unescape(entry.find('content').string))
      new_entry.save()
  except:
    pass
