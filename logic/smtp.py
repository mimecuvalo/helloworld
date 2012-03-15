import smtplib

has_email_support = False
try:
  from email.mime.text import MIMEText
  has_email_support = True
except:
  pass

import tornado.escape

def send(handler, subject, to, content):
  if not has_email_support or not handler.constants['smtp_password']:
    return

  msg = MIMEText(content)

  me = 'no-reply@' + handler.request.host

  msg['Subject'] = subject
  msg['From'] = me
  msg['To'] = to

  try:
    s = smtplib.SMTP('localhost')
    s.login(me, handler.constants['smtp_password'])
    s.sendmail(me, [to], msg.as_string())
    s.quit()
  except Exception as ex:
    import logging
    logging.error("efail :(")
    logging.error(ex)

def comment(handler, from_username, to_email, content_url):
  send(handler, handler.locale.translate('%(user)s made a comment on your post.' % { "user": from_username }), to_email, handler.locale.translate("""
    <a href="%(url)s">View the post here.</a>
  """) % { "url": content_url })

def follow(handler, from_username, to_email, blog):
  follow = handler.nav_url(host=True, section='api') + '?op=follow&amp;user=' + tornado.escape.url_escape(blog)
  send(handler, handler.locale.translate('%(user)s started following you!' % { "user": from_username }), to_email, handler.locale.translate("""
    <a href="%(url)s">View their blog.</a><br>
    <a href="%(follow)s">Follow them here.</a>
  """) % { "blog": blog, "follow": follow })
