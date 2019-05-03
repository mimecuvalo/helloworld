import constants from '../../../shared/constants';
import { contentUrl } from '../../../shared/util/url_factory';
import { convertFromRaw } from 'draft-js';
import { comment as emailComment } from './email';
import fetch from 'node-fetch';
import models from '../../data/models';
import { reply as salmonReply } from './salmon';
import { webmentionReply } from './webmention';

export default async function socialize(req, contentOwner, localContent, opt_remoteContent, opt_isComment) {
  if (localContent.hidden) {
    return;
  }

  await pubsubhubbubPush(req, localContent);

  await parseMentions(req, contentOwner, localContent, opt_remoteContent);

  if (opt_isComment) {
    const localContentUser = await models.User.findOne({ where: { username: localContent.username } });
    emailComment(
      req,
      opt_remoteContent.username,
      opt_remoteContent.comment_user,
      localContentUser.email,
      contentUrl(localContent, req),
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
    const threadContent = await models.Content_Remote.findOne({
      where: { to_username: content.username, post_id: content.thread },
    });
    if (!threadContent) {
      return;
    }
    const threadUserRemote = await models.User_Remote.findOne({
      where: { local_username: content.username, profile_url: threadContent.from_user },
    });
    addToUsersList(threadUserRemote, true);
  }

  // Find mentions in the text.
  // TODO(mime): support @blah@blah.com
  const plaintext = content.content ? convertFromRaw(JSON.parse(content.content)).getPlainText() : content.view;
  const mentions = plaintext.match(MENTION_REGEX) || [];
  for (const mention of mentions) {
    const userRemote = await models.User_Remote.findOne({
      where: { local_username: content.username, username: mention.slice(1) },
    });
    addToUsersList(userRemote, true);
  }

  // Find all users from the comments.
  if (content.comments_count) {
    const comments = await models.Content_Remote.findAll({
      where: {
        to_username: content.username,
        local_content_name: content.name,
        type: 'comment',
      },
    });
    for (const comment of comments) {
      const userRemote = await models.User_Remote.findOne({
        where: { local_username: content.username, username: comment.from_user },
      });
      addToUsersList(userRemote, false);
    }
  }

  if (opt_remoteContent) {
    // Find mentions in the comment text.
    // TODO(mime): support @blah@blah.com
    const plaintext = convertFromRaw(JSON.parse(opt_remoteContent.content)).getPlainText();
    const mentions = plaintext.match(MENTION_REGEX) || [];
    for (const mention of mentions) {
      const userRemote = await models.User_Remote.findOne({
        where: { local_username: content.username, username: mention.slice(1) },
      });
      addToUsersList(userRemote, true);
    }
  }

  for (const userRemote of remoteUsers) {
    webmentionReply(req, userRemote, content, content.thread, mentionedRemoteUsers);
    salmonReply(req, contentOwner, content, userRemote.salmon_url, mentionedRemoteUsers);
  }
}

async function pubsubhubbubPush(req, content) {
  try {
    const contentFeedUrl = contentUrl(content, req);
    await fetch(constants.pushHub, {
      method: 'POST',
      body: new URLSearchParams({ 'hub.url': contentFeedUrl, 'hub.mode': 'publish' }),
    });
  } catch (ex) {
    // Not a big deal if this fails.
  }
}
