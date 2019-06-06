import { convertFromRaw } from 'draft-js';
import { comment as emailComment } from './email';
import fetch from 'node-fetch';
import { reply as salmonReply } from './salmon';
import { webmentionReply } from './webmention';

export default (options) => async function syndicate(req, contentOwner, localContent, opt_remoteContent, opt_isComment) {
  if (localContent.hidden) {
    return;
  }

  await pubsubhubbubPush(req, options, localContent);

  await parseMentions(req, contentOwner, localContent, opt_remoteContent);

  if (opt_isComment) {
    const localContentUser = await options.getLocalUser(localContent.url);
    emailComment(
      req,
      opt_remoteContent.username,
      opt_remoteContent.comment_user,
      localContentUser.email,
      localContent.url,
      opt_remoteContent
    );
  }
}

const MENTION_REGEX = /[@+](\w+)/g;
async function parseMentions(req, contentOwner, content, opt_remoteContent) {
  const remoteUsers = [];
  const mentionedRemoteUsers = [];

  function addToUsersList(userRemote, shouldAddToMentions) {
    if (!userRemote || remoteUsers.find(el => el.profile_url === userRemote.profile_url)) {
      return;
    }

    if (userRemote.webmention_url) {
      remoteUsers.push(userRemote);
      shouldAddToMentions && mentionedRemoteUsers.push(userRemote);
    }
  }

  // Add user from original thread as mentioned user.
  if (content.thread) {
    const threadContent = await options.getRemoteContent(content.username, content.thread);
    if (!threadContent) {
      return;
    }
    const threadUserRemote = await options.getRemoteUser(content.username, threadContent.from_user); // XXX (mime): not right.
    addToUsersList(threadUserRemote, true);
  }

  // Find mentions in the text.
  // TODO(mime): support @blah@blah.com
  const plaintext = content.content ? convertFromRaw(JSON.parse(content.content)).getPlainText() : content.view;
  const mentions = plaintext.match(MENTION_REGEX) || [];
  for (const mention of mentions) {
    const userRemote = await options.getRemoteUser(content.username, mention.slice(1)); // XXX(mime): not right.
    addToUsersList(userRemote, true);
  }

  // Find all users from the comments.
  if (content.comments_count) {
    const comments = await options.getRemoteCommentsOnLocalContent(content.url);
    for (const comment of comments) {
      const userRemote = await options.getRemoteUser(content.username, comment.from_user); // XXX(mime): not right.
      addToUsersList(userRemote, false);
    }
  }

  if (opt_remoteContent) {
    // Find mentions in the comment text.
    // TODO(mime): support @blah@blah.com
    const plaintext = convertFromRaw(JSON.parse(opt_remoteContent.content)).getPlainText();
    const mentions = plaintext.match(MENTION_REGEX) || [];
    for (const mention of mentions) {
      const userRemote = await options.getRemoteUser(content.username, mention.slice(1)); // XXX(mime): not right.
      addToUsersList(userRemote, true);
    }
  }

  for (const userRemote of remoteUsers) {
    webmentionReply(req, userRemote, content, content.thread, mentionedRemoteUsers);
    salmonReply(req, contentOwner, content, userRemote.salmon_url, mentionedRemoteUsers);
  }
}

async function pubsubhubbubPush(req, options, content) {
  try {
    await fetch(options.constants.pushHub, {
      method: 'POST',
      body: new URLSearchParams({ 'hub.url': content.url, 'hub.mode': 'publish' }),
    });
  } catch (ex) {
    // Not a big deal if this fails.
  }
}
