import re

from logic import pubsubhubbub_publish
from logic import users

def socialize(handler, content):
  if content.hidden:
    return

  mentions = re.search(r'\W*@(\w*)(?=([^>;]*<*))', content.view, re.M | re.U)

  if content.thread or mentions:
    reply(handler, content, mentions)

  publish(handler, content)

def publish(handler, content):
  try:
    pubsubhubbub_publish.publish(handler.constants['push_hub'], handler.nav_url(host=True, username=content.username, section='feed'))
  except pubsubhubbub_publish.PublishError, e:
    # do nothing for now
    pass

def reply(handler, content, mentions=None, thread=None):
  profile = handler.get_author_username()
  thread = thread or content.thread

  thread_user_remote = None
  if thread:
    thread_content = handler.models.content_remote.get(to_username=profile, post_id=thread)[0]
    thread_user_remote = handler.models.users_remote.get(local_username=profile, profile_url=thread_content.from_user)[0]

    if thread_user_remote and thread_user_remote.salmon_url:
      users.salmon_reply(handler, thread_user_remote, content, thread=thread)

  if mentions:
    for user in mentions.groups():
      if not user:
        continue

      user_remote = handler.models.users_remote.get(local_username=profile, username=user)[0]

      if not user_remote or thread_user_remote.profile_url == user_remote.profile_url:
        continue

      if user_remote.salmon_url:
        users.salmon_reply(handler, user_remote, content, thread=thread)
