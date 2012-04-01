import re

THUMB_WIDTH = 154
THUMB_HEIGHT = 115
PHOTO_WIDTH = 650
PHOTO_HEIGHT = 525

def get_thumbnail(handler, content):
  if content.thumb:
    return content.thumb

  if content.section == 'main':
    content_options = { 'username' : content.username,
                        'section'  : content.name, }
  if content.album == 'main':
    content_options = { 'username' : content.username,
                        'section'  : content.section,
                        'album'    : content.name, }
  if content.section == 'main' or content.album == 'main':
    collection_item = handler.models.content.get(**content_options).order_by('order,date_created', 'DESC')[0]
    if collection_item:
      return collection_item.thumb

  content_owner = handler.models.users.get(username=content.username)[0]
  if content_owner.logo:
    return content_owner.logo

  return None

def is_viewed_by_robot(handler):
  robots = re.compile(r'bot|spider|crawl|slurp|ia_archiver', re.M | re.U | re.I)
  is_robot = "User-Agent" in handler.request.headers and robots.search(handler.request.headers["User-Agent"])

  return is_robot
