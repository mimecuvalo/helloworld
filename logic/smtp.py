import smtplib

has_email_support = False
try:
  from email.mime.multipart import MIMEMultipart
  from email.mime.text import MIMEText
  has_email_support = True
except:
  pass

import tornado.escape

def send(handler, subject, to, content):
  if not has_email_support or not handler.constants['smtp_password']:
    return

  msg = MIMEMultipart('alternative')

  me = 'no-reply@' + handler.request.host

  msg['Subject'] = subject
  msg['From'] = '"Hello, world." <' + me + '>'
  msg['To'] = to

  part1 = MIMEText(content, 'html')
  msg.attach(part1)

  try:
    s = smtplib.SMTP('localhost')
    s.login(me, handler.constants['smtp_password'])
    s.sendmail(me, [to], msg.as_string())
    s.quit()
  except Exception as ex:
    import logging
    logging.error("efail :(")
    logging.error(repr(ex))

def comment(handler, from_username, to_email, content_url, comment, this_user_mentioned=False):
  if this_user_mentioned:
    send(handler, handler.locale.translate('%(user)s made a post mentioning you in it!' % { "user": from_username }), to_email, handler.locale.translate("""
      <a href="%(url)s">View the post here!</a>
    """) % { "url": content_url })
  else:
    send(handler, handler.locale.translate('%(user)s made a comment on your post.' % { "user": from_username }), to_email, handler.locale.translate("""
      %(comment)s<br><a href="%(url)s">View the post here!</a>
    """) % { "comment": comment, "url": content_url })

def follow(handler, from_username, to_email, blog):
  follow = handler.nav_url(host=True, section='api') + '?op=follow&amp;from_email=1&amp;user=' + tornado.escape.url_escape(blog)
  send(handler, handler.locale.translate('%(user)s started following you!' % { "user": from_username }), to_email, handler.locale.translate("""
    <a href="%(blog)s">View their blog.</a><br><br>
    If you like their stuff, you can <a href="%(follow)s">follow them here.</a>
  """) % { "blog": blog, "follow": follow })
