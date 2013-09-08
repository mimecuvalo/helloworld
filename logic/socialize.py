import re

from logic import content_remote
from logic import pubsubhubbub_publish
from logic import users as user_logic

def socialize(handler, content):
  if content.hidden:
    return

  # TODO support @blah@blah.com
  mentions  = re.findall(r'@(\w+)', content.view, re.M | re.U)
  mentions += re.findall(r'\+(\w+)', content.view, re.M | re.U)

  reply(handler, content, mentions)

  publish(handler, content)

def publish(handler, content):
  try:
    pubsubhubbub_publish.publish(handler.constants['push_hub'],
        handler.nav_url(host=True, username=content.username, section='feed'))
  except pubsubhubbub_publish.PublishError, e:
    # do nothing for now
    pass

def reply(handler, content, mentions=None):
  profile = content.username

  thread_user_remote = None
  users = []
  users_profile = []
  mentioned_users = []
  if content.thread:
    thread_content = handler.models.content_remote.get(to_username=profile,
        post_id=content.thread)[0]
    if not thread_content:
      return
    thread_user_remote = handler.models.users_remote.get(
        local_username=profile, profile_url=thread_content.from_user)[0]

    if thread_user_remote and thread_user_remote.webmention_url:
      users.append(thread_user_remote)
      users_profile.append(thread_user_remote.profile_url)
      mentioned_users.append(thread_user_remote)

  if mentions:
    for user in mentions:
      user_remote = handler.models.users_remote.get(local_username=profile,
          username=user)[0]

      if not user_remote or (thread_user_remote and
          thread_user_remote.profile_url == user_remote.profile_url):
        continue

      if user_remote.profile_url in users_profile:
        continue

      if user_remote.webmention_url:
        users.append(user_remote)
        users_profile.append(user_remote.profile_url)
        mentioned_users.append(user_remote)

  if content.comments_count:
    comments = content_remote.get_comments(handler, content)

    for comment in comments:
      user_remote = handler.models.users_remote.get(local_username=profile,
          username=comment.from_user)[0]

      if not user_remote:
        continue

      if user_remote.profile_url in users_profile:
        continue

      # TODO(mime): Necessary to check webmention_url?
      if user_remote and user_remote.webmention_url:
        users.append(user_remote)
        users_profile.append(user_remote.profile_url)

  for user in users:
    user_logic.webmention_reply(handler, user, content, thread=content.thread,
        mentioned_users=mentioned_users)
