import datetime
import re
import tornado.template
import tornado.web
import urllib

from logic import content_remote
from logic import url_factory

class Create(tornado.web.UIModule):
  def render(self, content=None, edit=False, individual_content=True):
    self.handler.display["individual_content"] = individual_content
    self.handler.display["content"] = content
    self.handler.display["edit"] = self.handler.get_argument('edit', False)
    self.handler.display["default_username"] = self.handler.get_author_username()
    self.handler.display["remote_users"] = self.handler.models.users_remote.get(local_username=self.handler.display["default_username"])[:]
    self.handler.display["sections"] = self.handler.get_sections_with_albums(profile=self.handler.display["default_username"])
    self.handler.display["section_template"] = self.handler.get_argument('section_template', None)
    self.handler.display["templates"] = self.handler.constants['templates']
    return self.render_string("_create.html", **self.handler.display)

class Moderate(tornado.web.UIModule):
  def render(self, item):
    self.handler.display["item"] = item
    self.handler.display["urlencode"] = urllib.urlencode
    return self.render_string("_moderate.html", **self.handler.display)

class SiteMap(tornado.web.UIModule):
  def render(self, content_owner, content=None, query=None):
    self.handler.display["sitemap"] = self.handler.generate_sitemap(content)
    self.handler.display["content_owner"] = content_owner
    self.handler.display["content"] = content
    self.handler.display["query"] = query
    return self.render_string("_sitemap.html", **self.handler.display)


class Content(tornado.web.UIModule):
  def render(self, content, simple=True, template_type=None, sanitize=False):
    content.restricted = False
    content.is_remote = False

    try:
      if not self.handler.authenticate(content=content, auto_login=(not simple)):
        if simple:
          content.restricted = True
          content.view = '"You need to <a href="' + self.handler.nav_url(host=True, section="login") + '">login</a> to view this content.'
          return content
        else:
          raise tornado.web.HTTPError(401)
    except tornado.web.HTTPError as ex:
      if simple:
        content.restricted = True
        content.view = '<span style="color:red">Sorry, you don\'t have access to view this content.</span>'
        return content
      else:
        # re-raise
        raise ex

    if sanitize:
      content.view = content_remote.sanitize(content.view)

    return content

class RemoteContent(tornado.web.UIModule):
  def render(self, content):
    content.restricted = False
    content.is_remote = True

    return content

class ContentView(tornado.web.UIModule):
  def render(self, content, list_mode=False):
    self.handler.display["individual_content"] = type(content) is not list
    self.handler.display["referrer"] = self.handler.get_argument('referrer', "")

    self.handler.display['favorites'] = []
    self.handler.display['comments'] = []
    self.handler.display['list_mode'] = list_mode

    if not self.handler.display["individual_content"]:
      self.handler.display["feed"] = content
      for item in content:
        if item.is_remote:
          continue
        item.view = re.sub(r'(<[^<]*class="hw-read-more".*)', \
                              r'<a class="hw-read-more" href="' + self.handler.content_url(item) + r'">' \
                                + self.locale.translate('read more...') \
                            + r'</a>', \
                              item.view)
    else:
      self.handler.display["content"] = content

      if content.favorites:
        self.handler.display['favorites'] = self.handler.models.content_remote.get(to_username=content.username,
                                                                                   local_content_name=content.name,
                                                                                   type='favorite')[:]
      if content.comments:
        remote_comments = self.handler.models.content_remote.get(to_username=content.username,
                                                                 local_content_name=content.name,
                                                                 type='comment',
                                                                 is_spam=False,
                                                                 deleted=False)[:]
        for comment in remote_comments:
          comment.is_remote = 1
        thread_url = 'tag:' + self.handler.request.host + ',' + self.handler.display["tag_date"] + ':' + self.handler.content_url(content)
        local_comments = self.handler.models.content.get(section='comments',
                                                         thread=thread_url,
                                                         is_spam=False,
                                                         deleted=False)[:]
        for comment in local_comments:
          comment.is_remote = 0
        self.handler.display['comments'] = local_comments + remote_comments
        self.handler.display['comments'].sort(key=lambda x: x.date_created, reverse=True)

    return self.render_string("content.html", **self.handler.display)


class SimpleTemplate(tornado.web.UIModule):
  template_type = ""

  def render(self):
    if self.handler.breadcrumbs["name"] == 'main':
      raise tornado.web.HTTPError(404)

    collection, common_options = self.handler.get_collection()

    if collection and self.template_type == 'slideshow':
      collection.reverse()

    self.handler.display["collection"] = [ self.handler.ui["modules"].Content(content, template_type=self.template_type) for content in collection ]

    if not collection:
      del common_options['redirect']
      section_options = { 'username' : self.handler.breadcrumbs["profile"],
                          'section' : 'main',
                          'name' : self.handler.breadcrumbs["name"], }
      album_options = { 'username' : self.handler.breadcrumbs["profile"],
                          'section' : self.handler.breadcrumbs["section"],
                          'album' : 'main',
                          'name' : self.handler.breadcrumbs["name"], }
      section_options = dict(common_options.items() + section_options.items())
      album_options = dict(common_options.items() + album_options.items())
      main_section = self.handler.models.content.get(**section_options).order_by('date_created', 'DESC')[:]
      main_album = self.handler.models.content.get(**album_options).order_by('date_created', 'DESC')[:]
      if not main_album and not main_section:
        raise tornado.web.HTTPError(404)

      return self.handler.fill_template("simple.html")
    else:
      return self.handler.fill_template(self.template_type + ".html")


class Album(SimpleTemplate):
  template_type = "album"

class Store(SimpleTemplate):
  template_type = "album"

class Forum(SimpleTemplate):
  template_type = "forum"

class Archive(SimpleTemplate):
  template_type = "archive"

# this template doesn't exist anymore, keep around class for backwards compatibility
class Links(SimpleTemplate):
  template_type = "album"

class Slideshow(SimpleTemplate):
  template_type = "slideshow"


class Feed(tornado.web.UIModule):
  template_type = "feed"

  def render(self):    
    if self.handler.breadcrumbs["name"] == 'main':
      raise tornado.web.HTTPError(404)

    offset = int(self.handler.breadcrumbs["modifier"]) if self.handler.breadcrumbs["modifier"] else 1
    offset -= 1
    begin  = self.handler.constants['page_size'] * offset
    end    = self.handler.constants['page_size'] * offset + self.handler.constants['page_size']

    is_owner_viewing = self.handler.is_owner_viewing(self.handler.breadcrumbs["profile"])

    if self.handler.breadcrumbs["section"] != 'main':
      content_options = { 'username': self.handler.breadcrumbs["profile"],
                          'section': self.handler.breadcrumbs["section"],
                          'album': self.handler.breadcrumbs["name"],
                          'redirect': False, }
    elif self.handler.breadcrumbs["name"] != 'home':
      content_options = { 'username': self.handler.breadcrumbs["profile"],
                          'section': self.handler.breadcrumbs["name"],
                          'redirect': False, }
    else:
      content_options = { 'username': self.handler.breadcrumbs["profile"],
                          #'section !=' : 'comments',
                          'redirect': False, }

    if not is_owner_viewing:
      content_options['hidden'] = False

    if self.template_type == 'events':
      if self.handler.get_argument('past', ''):
        content_options['date_end <'] = datetime.datetime.utcnow()
      else:
        content_options['date_end >'] = datetime.datetime.utcnow()
      feed = self.handler.models.content.get(**content_options).order_by('date_start')[begin:end]
    else:
      feed = self.handler.models.content.get(**content_options).order_by('date_created', 'DESC')[begin:end]

    if not feed and self.handler.request.headers.get("X-Requested-With") == "XMLHttpRequest":
      raise tornado.web.HTTPError(404)

    self.handler.display["feed"] = [ self.handler.ui["modules"].Content(content) \
        for content in feed if content.section != 'main' and content.album != 'main' ]  # todo, this should move to query really
    self.handler.display["offset"] = offset + 1
    self.handler.display["is_event"] = self.template_type == "events"

    if self.handler.request.headers.get("X-Requested-With") == "XMLHttpRequest":
      self.handler.prevent_caching()
      self.handler.write(self.handler.ui["modules"].ContentView(self.handler.display["feed"]))
    else:
      if not feed:
        # TODO merge with SimpleTemplate
        section_options = { 'username' : self.handler.breadcrumbs["profile"],
                            'section' : 'main',
                            'name' : self.handler.breadcrumbs["name"], }
        album_options = { 'username' : self.handler.breadcrumbs["profile"],
                            'section' : self.handler.breadcrumbs["section"],
                            'album' : 'main',
                            'name' : self.handler.breadcrumbs["name"], }
        if not is_owner_viewing:
          section_options['hidden'] = False
          album_options['hidden'] = False

        main_section = self.handler.models.content.get(**section_options).order_by('date_created', 'DESC')[:]
        main_album = self.handler.models.content.get(**album_options).order_by('date_created', 'DESC')[:]

        if not main_album and not main_section:
          raise tornado.web.HTTPError(404)

        self.handler.fill_template("simple.html")
      else:
        self.handler.fill_template("content_feed.html")

class Events(Feed):
  template_type = "events"

class JumpTemplate(tornado.web.UIModule):
  template_type = ""

  def render(self):
    if self.handler.get_argument('mode', None) == 'archive':
      return self.ui["modules"]['Archive']()

    is_owner_viewing = self.handler.is_owner_viewing(self.handler.breadcrumbs["profile"])
    content_options = { 'username': self.handler.breadcrumbs["profile"],
                        'section': self.handler.breadcrumbs["name"],
                        'redirect': False, }
    if not is_owner_viewing:
      content_options['hidden'] = False

    if self.template_type == "latest":
      count = self.handler.models.content.get(**content_options).count()
      jump = self.handler.models.content.get(**content_options)[count - 1:count]
    else:
      jump = self.handler.models.content.get(**content_options)[0:1]

    if not jump:
      raise tornado.web.HTTPError(404)
      
    jump_url = self.handler.content_url(jump[0])

    if self.handler.display["edit"]:
      self.handler.display['redirect'] = jump_url
      self.handler.fill_template("redirect.html")
    else:
      self.handler.redirect(jump_url)

class First(JumpTemplate):
  template_type = "first"

class Latest(JumpTemplate):
  template_type = "latest"

class Blank(tornado.web.UIModule):
  def render(self):
    self.handler.fill_template("blank.html")

class Redirect(tornado.web.UIModule):
  def render(self):
    redirect = self.handler.models.content.get(username=self.handler.breadcrumbs["profile"], section=self.handler.breadcrumbs["section"], name=self.handler.breadcrumbs["name"])[0]

    if self.handler.display["edit"]:
      self.handler.display['redirect'] = redirect.view
      self.handler.fill_template("redirect.html")
    else:
      self.handler.redirect(redirect.view)

class StoreButton(tornado.web.UIModule):
  def render(self, item, content_owner):
    self.handler.display['mode'] = 'button'
    self.handler.display['item'] = item
    self.handler.display['content_owner'] = content_owner
    return self.render_string("store.html", **self.handler.display)

class StoreCheckout(tornado.web.UIModule):
  def render(self, item, content_owner):
    self.handler.display['mode'] = 'checkout'
    self.handler.display['item'] = item
    self.handler.display['content_owner'] = content_owner
    return self.render_string("store.html", **self.handler.display)
