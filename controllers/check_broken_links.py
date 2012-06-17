import re
import urllib2

from base import BaseHandler

class CheckBrokenLinksHandler(BaseHandler):
  def get(self):
    if not self.authenticate(author=True):
      return

    url = self.get_argument('url', '')
    if url:
      self.check_link(url)
      return

    self.display["user"] = self.get_author_user()

    all_content = self.models.content.get(
        username=self.display["user"].username)

    links = []
    for content in all_content:
      urls = re.findall(r'http://[^ <\'"]+', content.view, re.I | re.M)
      if urls:
        links.append({ 'content': content, 'urls': urls })
    self.display["links"] = links[:10]

    self.fill_template("check_broken_links.html")

  def check_link(self, url):
    try:
      response = urllib2.urlopen(url)
      self.write('1')
    except:
      self.write('0')
