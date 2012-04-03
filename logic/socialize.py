import re

from logic import pubsubhubbub_publish
from logic import users as user_logic

def socialize(handler, content):
  if content.hidden:
    return

  mentions = re.findall(r'@(\w+)', content.view, re.M | re.U)
  mentions = re.findall(r'\+(\w+)', content.view, re.M | re.U)

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
  thread = thread or content.thread # XXX this is pretty damn confusing...'thread' used for local comments, content.thread for remote

  thread_user_remote = None
  users = []
  mentioned_users = []
  if thread:
    thread_content = handler.models.content_remote.get(to_username=profile, post_id=thread)[0]
    if not thread_content:
      return
    thread_user_remote = handler.models.users_remote.get(local_username=profile, profile_url=thread_content.from_user)[0]

    if thread_user_remote and thread_user_remote.salmon_url:
      users.append(thread_user_remote)
      mentioned_users.append(thread_user_remote)

  if mentions:
    for user in mentions:
      user_remote = handler.models.users_remote.get(local_username=profile, username=user)[0]

      if not user_remote or (thread_user_remote and thread_user_remote.profile_url == user_remote.profile_url):
        continue

      if user_remote.salmon_url:
        users.append(user_remote)
        mentioned_users.append(user_remote)

  # XXX todo, combine with uimodule code
  if content.comments:
    remote_comments = handler.models.content_remote.get(to_username=content.username,
                                                        local_content_name=content.name,
                                                        type='comment',
                                                        is_spam=False,
                                                        deleted=False)[:]
    for comment in remote_comments:
      user_remote = handler.models.users_remote.get(local_username=profile, username=comment.from_user)[0]
      if user_remote:
        users.append(user_remote)
    thread_url = 'tag:' + handler.request.host + ',' + handler.display["tag_date"] + ':' + handler.content_url(content)
    # XXX todo, actually, we should eventually stop looking at local comments this way
    local_comments = handler.models.content.get(section='comments',
                                                thread=thread_url,
                                                is_spam=False,
                                                deleted=False)[:]
    for comment in local_comments:
      user_local = handler.models.users.get(username=comment.username)[0]
      users.append(user_local)

  for user in users:
    user_logic.salmon_reply(handler, user, content, thread=thread, mentioned_users=mentioned_users)
