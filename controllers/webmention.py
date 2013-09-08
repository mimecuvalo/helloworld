import urllib2
import urlparse

from BeautifulSoup import BeautifulSoup
import tornado.escape
import tornado.web

from base import BaseHandler
from logic import content_remote
from logic import smtp
from logic import spam
from logic import url_factory

class WebmentionHandler(BaseHandler):
  def post(self):
    acct = self.get_argument("q").split(':')

    # remove acct: if it's there
    if len(acct) > 1:
      acct[0] = acct[1].split('@')[0]

    acct = acct[0].split('@')[0]

    self.display["acct"] = acct
    user = self.models.users.get(username=acct)[0]

    if not user:
      raise tornado.web.HTTPError(400)

    self.display["user"] = user

    env = urlparse.parse_qs(self.request.body)
    if not env['target'] or not env['source']:
      raise tornado.web.HTTPError(400)

    content_url = url_factory.load_basic_parameters(self, url=env['target'][0])
    content = self.models.content.get(username=self.display["user"].username,
                                      name=content_url['name'])[0]
    if not content:
      raise tornado.web.HTTPError(400)

    self.handle_mention(content_url, content, env['target'][0], env['source'][0])

    # Accepted
    self.set_status(202)

  # tornado & python rock
  def check_xsrf_cookie(self):
    pass


  def handle_mention(self, local_content_url, local_content,
      target_url, source_url):
    source_html = urllib2.urlopen(source_url)
    source_html = content_remote.sanitize(
        tornado.escape.xhtml_unescape(source_html.read()))
    source_doc = BeautifulSoup(source_html)

    hEntry = source_doc.find(attrs={'class':re.compile(r'\bh-entry\b')})
    if not hEntry:
      return

    remote_content = hEntry.find(
        attrs={'class':re.compile(r'\be-content\b')}).string

    existing_content = self.models.content_remote.get(
        to_username=self.display["user"].username,
        from_user=source_url,
        view=remote_content)[0]

    # TODO(mime): source_url should actually point to the user's url
    # Should look at webfinger for url.
    this_user_url = self.nav_url(host=True,
        username=self.display["user"].username)
    thread = target_url != this_user_url

    if thread:
      try:
        local_content.comments_count += 1
        local_content.comments_updated = datetime.datetime.utcnow()
        local_content.save()
      except Exception as ex:
        import logging
        logging.error("something wrong with thread")
        logging.error(ex)

    is_spam = spam.guess(remote_content,
        self.application.settings["private_path"],
        self.display["user"].username)

    if existing_content:
      # possible that it's picked up via feed, before we get the salmon call
      post_remote = existing_content
    else:
      post_remote = self.models.content_remote()
    post_remote.to_username = self.display["user"].username
    post_remote.from_user = source_url
    post_remote.username = 'Remote User'
    post_remote.avatar = '' # TODO(mime): user_remote.avatar
    published = hEntry.find(
        attrs={'class':re.compile(r'\bdt-published\b'), 'datetime':re.compile('.+')})
    if published:
      post_remote.date_created = datetime.datetime.strptime(
          published['datetime'].string[:-6], '%Y-%m-%dT%H:%M:%S')
    updated = hEntry.find(
        attrs={'class':re.compile(r'\bdt-updated\b'), 'datetime':re.compile('.+')})
    if updated:
      post_remote.date_updated = datetime.datetime.strptime(
          updated['datetime'].string[:-6], '%Y-%m-%dT%H:%M:%S')
    if is_spam:
      post_remote.is_spam = True
    else:
      spam.train_ham(remote_content, self.application.settings["private_path"],
          self.display["user"].username)
    post_remote.type = 'comment' if thread or (existing_content and
        existing_content.type == 'comment') else 'post'
    title = hEntry.find(
        attrs={'class':re.compile(r'\bp-summary\b')})
    if title:
      post_remote.title = title.string
    post_remote.post_id = source_url
    post_remote.link = source_url
    post_remote.local_content_name = content.name if thread else ''
    post_remote.view = remote_content
    post_remote.save()

    if thread:
      smtp.comment(self, post_remote.username, post_remote.from_user,
          self.display["user"].email, self.content_url(content, host=True),
          remote_content)
    else:
      smtp.comment(self, post_remote.username, post_remote.from_user,
          self.display["user"].email, post_remote.link,
          remote_content, this_user_mentioned=True)
