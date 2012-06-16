# -*- coding: utf-8 -*-

import datetime
import re

import tornado.escape
import tornado.web

from logic import url_factory

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

def get_main_sections(handler, profile):
  content_options = { 'username': profile,
                      'section': 'main', }

  if not handler.is_owner_viewing(profile):
    content_options['hidden'] = False

  sections = handler.models.content.get(**content_options).order_by('order')[:]
  filtered_sections = []
  for section in sections:
    if not (section.name == 'home' or section.name == 'main' or section.name == 'comments' or section.redirect):
      filtered_sections.append(section)

  return filtered_sections

def get_albums(handler, profile, section):
  content_options = { 'username': profile,
                      'section': section,
                      'album': 'main', }

  if not handler.is_owner_viewing(profile):
    content_options['hidden'] = False

  return handler.models.content.get(**content_options).order_by('order')[:]

def get_sections_with_albums(handler, profile, section=None, album=None):
  sitemap = []
  main_sections = get_main_sections(handler, profile)

  for main_section in main_sections:
    main_section_name = main_section.name
    main_section_title = main_section.title

    albums = [ { 'name': main_album.name,
                 'title': main_album.title,
                 'hidden': main_album.hidden,
                 'template': main_album.template,
                 'selected': main_album.name == album and main_section_name == section }
               for main_album in get_albums(handler, profile=profile, section=main_section_name) if not main_album.redirect ]
    sitemap.append({ 'username': profile,
                     'title': main_section_title,
                     'name': main_section_name,
                     'albums': albums,
                     'hidden': main_section.hidden,
                     'template': main_section.template,
                     'selected': main_section_name == section })

  return sitemap

def create_section(handler, profile, section, original_template=""):
  if section == 'main':
    return section

  title = section
  section = url_factory.clean_name(section)

  if section in handler.constants['reserved_names']:
    handler.set_status(400)
    handler.write("dup-section")
    raise tornado.web.HTTPError(400)

  section_item = handler.models.content.get(username=profile,
                                            section='main',
                                            name=section)[0]
  if not section_item:
    new_section = handler.models.content()
    new_section.username = profile
    new_section.section  = 'main'
    section = get_unique_name(handler, content=new_section, title=title)
    new_section.name     = section
    new_section.title    = title
    new_section.template = original_template
    new_section.date_created = datetime.datetime.utcnow()
    new_section.date_updated = datetime.datetime.utcnow()
    new_section.save()

    handler.set_header('X-Helloworld-Section', section)

  return section

def rename_section(handler, old_name, new_name, new_title):
  new_name = url_factory.clean_name(new_name)

  profile = handler.get_author_username()

  section_item = handler.models.content.get(username=profile,
                                            section='main',
                                            name=old_name)[0]
  section_item.name = new_name
  section_item.title = new_title
  section_item.save()

  collection = handler.models.content.get(username=profile,
                                          section=old_name)[:]
  for item in collection:
    item.section = new_name
    item.save()

  create_redirect(handler, section_item, 'main', old_name)

  return new_name

def create_album(handler, profile, section, album, original_template=""):
  if not album:
    return ""

  if album == 'main':
    return album

  title = album
  album = url_factory.clean_name(album)

  if album in handler.constants['reserved_names']:
    handler.set_status(400)
    handler.write("dup-album")
    raise tornado.web.HTTPError(400)

  album_item = handler.models.content.get(username=profile,
                                          section=section,
                                          album='main',
                                          name=album)[0]

  parent_section = handler.models.content.get(username=profile,
                                            section='main',
                                            name=section)[0]
  if not album_item:
    new_album = handler.models.content()
    new_album.username = profile
    new_album.section  = section
    new_album.album    = 'main'
    album = get_unique_name(handler, content=new_album, title=title)
    new_album.name     = album
    new_album.title    = title
    new_album.hidden   = parent_section.hidden
    new_album.template = original_template
    new_album.date_created = datetime.datetime.utcnow()
    new_album.date_updated = datetime.datetime.utcnow()
    new_album.save()

    handler.set_header('X-Helloworld-Album', album)

  return album

def rename_album(handler, old_section, old_name, new_name, new_title):
  new_name = url_factory.clean_name(new_name)

  profile = handler.get_author_username()

  album_item = handler.models.content.get(username=profile,
                                          section=old_section,
                                          album='main',
                                          name=old_name)[0]
  album_item.name = new_name
  album_item.title = new_title
  album_item.save()

  collection = handler.models.content.get(username=profile,
                                          section=old_section,
                                          album=old_name)[:]
  for item in collection:
    item.album = new_name
    item.save()

  create_redirect(handler, album_item, old_section, old_name)

  return new_name

def create_redirect(handler, original, old_section, old_name):
  if original.hidden:
    return

  redirect_content = handler.models.content()
  redirect_content.redirect = original.id
  redirect_content.username = original.username
  redirect_content.section  = old_section
  redirect_content.name     = old_name
  redirect_content.date_created = original.date_created
  redirect_content.date_updated = original.date_updated
  redirect_content.save()

def get_unique_name(handler, content, name="_", title=None):
  if not title:
    title = handler.locale.translate('untitled')

  # check to see if name is unique
  if name and name != '_':
    name = url_factory.clean_name(name)
    existing_content = handler.models.content.get(username=content.username, name=name)[0]
    if (existing_content and existing_content.id != content.id) or name in handler.constants['reserved_names']:
      handler.set_status(400)
      handler.write("dup-name")
      raise tornado.web.HTTPError(400)
  else:
    name = url_factory.clean_name(title)
    new_name = name
    counter = 1
    options = { 'username': content.username, 'name like': new_name + '-%' }
    highest_existing_name = handler.models.content.get(**options).order_by('id', 'DESC')[0]
    if highest_existing_name:
      existing_counter = highest_existing_name.name.split('-')[1]
      try:
        counter = int(existing_counter) + 1
        new_name = name + '-' + str(counter)
      except:
        pass # if existing_counter is not a possible number
    while True:
      existing_content = handler.models.content.get(username=content.username, name=new_name)[0]
      if existing_content or new_name in handler.constants['reserved_names']:
        new_name = name + '-' + str(counter)
        counter += 1
      else:
        name = new_name
        break

  return name

def get_collection(handler, profile=None, section=None, name=None):
  profile = profile or handler.breadcrumbs["profile"]
  section = section or handler.breadcrumbs["section"]
  name = name or handler.breadcrumbs["name"]

  common_options = { 'redirect': False }
  if not handler.is_owner_viewing(profile):
    common_options['hidden'] = False

  if section != 'main':
    collection_entry = handler.models.content.get(username=profile, name=section)[0]
  if section == 'main' or not collection_entry.sort_type:
    collection_entry = handler.models.content.get(username=profile, name=name)[0]

  sort_type, sort_direction = get_sort_directives(collection_entry.sort_type)

  collection = None
  if section != 'main':
    content_options = { 'username' : profile,
                        'section' : section,
                        'album' : name, }
    content_options = dict(common_options.items() + content_options.items())
    collection = handler.models.content.get(**content_options).order_by(sort_type, sort_direction)[:]

  if not collection:
    content_options = { 'username' : profile,
                        'section' : name,
                        'album' : 'main', }
    content_options = dict(common_options.items() + content_options.items())
    collection = handler.models.content.get(**content_options).order_by(sort_type, sort_direction)[:]

    album_options = content_options
    for item in collection:
      album_options['album'] = item.name
      album_sort_type, album_sort_direction = get_sort_directives(item.sort_type)
      album_item = handler.models.content.get(**content_options).order_by(album_sort_type, album_sort_direction)[0]
      if album_item:
        item.thumb = album_item.thumb

    content_options = { 'username' : profile,
                        'section' : name,
                        'album' : '', }
    content_options = dict(common_options.items() + content_options.items())
    collection += handler.models.content.get(**content_options).order_by(sort_type, sort_direction)[:]

  if not collection and section != 'main':
    content_options = { 'username' : profile,
                        'section' : section, }
    content_options = dict(common_options.items() + content_options.items())
    collection = handler.models.content.get(**content_options).order_by(sort_type, sort_direction)[:]

  return collection, common_options

def get_sort_directives(entry_sort_type):
  sort_type = 'date_created'
  sort_direction = 'DESC'
  if entry_sort_type == 'oldest':
    sort_direction = 'ASC'
  elif entry_sort_type == 'alphabetical':
    sort_type = 'title'
    sort_direction = 'ASC'
  sort_type = 'order,' + sort_type

  return sort_type, sort_direction

def strip_html(html):
  text = re.compile(r'<[^<]+?>|&.+?;', re.M | re.U).sub('', html)
  return re.compile(r'\s+').sub(' ', text)

def ellipsize(text, max_length, including_dots=False):
  if len(text) <= max_length:
    return text
  if including_dots:
    return text[:max_length - 3] + '...'
  return text[:max_length] + '...'

def js_escape(string):
  return string.replace("'", "\\'").replace('"', '\\"')

def js_in_html_escape(string):
  return tornado.escape.xhtml_escape(string).replace("'", "'").replace('"', '\\"').replace('&quot;', '\\"')

def bidi(string):
  # modified from goog.i18n.bidi
  # Copyright 2007 The Closure Library Authors. All Rights Reserved.
  #
  # Licensed under the Apache License, Version 2.0 (the "License");
  # you may not use this file except in compliance with the License.
  # You may obtain a copy of the License at
  #
  #      http://www.apache.org/licenses/LICENSE-2.0
  #
  # Unless required by applicable law or agreed to in writing, software
  # distributed under the License is distributed on an "AS-IS" BASIS,
  # WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  # See the License for the specific language governing permissions and
  # limitations under the License.
  rtlChars_ = ur'\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC'
  ltrChars_ = ur'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u2C00-\uFB1C\uFE00-\uFE6F\uFEFD-\uFFFF';
  rtlDirCheckRe_ = ur'^[^' + ltrChars_ + ur']*[' + rtlChars_ + ur']'
  htmlSkipReg_ = ur'<[^>]*>|&[^;]+;'
  return 'dir="rtl"' if re.search(rtlDirCheckRe_, re.sub(htmlSkipReg_, '', string)) else ''
