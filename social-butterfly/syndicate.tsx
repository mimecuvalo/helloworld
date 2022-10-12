import { reply as activityStreamsReply } from './activitystreams';
import cheerio from 'cheerio';
import { convertFromRaw } from 'draft-js';
import { comment as emailComment } from './email';
import { ensureAbsoluteUrl } from './util/url_factory';
import fetch from 'node-fetch';
import { fetchText } from './util/crawler';
import { reply as webmentionReply } from './webmention';

export default (options) =>
  async function syndicate(req, contentOwner, localContent, opt_remoteContent, opt_isComment) {
    if (localContent.hidden) {
      return;
    }

    await webSubPush(req, options, localContent);

    await parseMentions(req, options, contentOwner, localContent, opt_remoteContent);

    if (opt_isComment) {
      const localContentUser = await options.getLocalUser(localContent.url, req);
      emailComment(
        req,
        opt_remoteContent.username,
        opt_remoteContent.comment_user,
        localContentUser.email,
        localContent.url,
        opt_remoteContent
      );
    }
  };

function findMentionsInDraftJS(draftJsContent) {
  const contentState = convertFromRaw(JSON.parse(draftJsContent));

  return Object.keys(contentState.entityMap)
    .map((key) => contentState.getEntity(contentState.entityMap[key]))
    .filter((entity) => entity.type === 'mention' || entity.type === 'rsvp')
    .map((entity) => entity.data.mention.link);
}

async function parseMentions(req, options, contentOwner, content, opt_remoteContent) {
  const remoteUsers = [];
  const mentionedRemoteUsers = [];

  async function addToUsersList(userRemote, threadUrl, shouldAddToMentions) {
    if (!userRemote && threadUrl) {
      const webpage = await fetchText(threadUrl);
      const $ = cheerio.load(webpage);
      let webmention_url = $('link[rel="webmention"]').attr('href');
      webmention_url = ensureAbsoluteUrl(threadUrl, webmention_url);

      // TODO(mime): pretty funky smell. refactor.
      if (webmention_url) {
        userRemote = {
          webmention_url,
        };
      }
    }

    if (!userRemote || remoteUsers.find((el) => el.profile_url === userRemote.profile_url)) {
      return;
    }

    if (userRemote.salmon_url || userRemote.activitypub_inbox_url || userRemote.webmention_url) {
      remoteUsers.push(userRemote);
      shouldAddToMentions && mentionedRemoteUsers.push(userRemote);
    }
  }

  // Add user from original thread as mentioned user.
  if (content.thread) {
    const threadContent = await options.getRemoteContent(content.username, content.thread);
    let threadUserRemote;
    if (threadContent) {
      threadUserRemote = await options.getRemoteUser(content.username, threadContent.from_user);
    }
    await addToUsersList(threadUserRemote, content.thread, true);
  }

  // Find mentions in the text.
  // TODO(mime): support @blah@blah.com
  const mentions = (content.content && findMentionsInDraftJS(content.content)) || [];
  for (const mention of mentions) {
    const userRemote = await options.getRemoteUser(content.username, mention);
    await addToUsersList(userRemote, undefined /* threadUrl */, true);
  }

  // Find all users from the comments.
  if (content.comments_count) {
    const comments = await options.getRemoteCommentsOnLocalContent(content.url);
    for (const comment of comments) {
      const userRemote = await options.getRemoteUser(content.username, comment.from_user);
      await addToUsersList(userRemote, undefined /* threadUrl */, false);
    }
  }

  if (opt_remoteContent) {
    // Find mentions in the comment text.
    // TODO(mime): support @blah@blah.com
    const mentions = (opt_remoteContent.content && findMentionsInDraftJS(opt_remoteContent.content)) || [];
    for (const mention of mentions) {
      const userRemote = await options.getRemoteUser(content.username, mention);
      await addToUsersList(userRemote, undefined /* threadUrl */, true);
    }
  }

  for (const userRemote of remoteUsers) {
    if (userRemote.activitypub_inbox_url || userRemote.salmon_url) {
      activityStreamsReply(req, contentOwner, content, userRemote, mentionedRemoteUsers);
    } else if (userRemote.webmention_url) {
      webmentionReply(req, contentOwner, content, userRemote, mentionedRemoteUsers);
    }
  }
}

async function webSubPush(req, options, content) {
  try {
    await fetch(options.constants.webSubHub, {
      method: 'POST',
      body: new URLSearchParams({ 'hub.url': content.url, 'hub.mode': 'publish' }),
    });
  } catch (ex) {
    // Not a big deal if this fails.
  }
}
