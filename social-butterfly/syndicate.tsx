import { Content, ContentRemote, User, UserRemote } from '@prisma/client';
//import { comment as emailComment } from './email';
import { contentUrl, ensureAbsoluteUrl } from 'util/url-factory';
import { getRemoteCommentsOnLocalContent, getRemoteContent, getRemoteUser } from './db';

import { NextApiRequest } from 'next';
import { WEB_SUB_HUB } from 'util/constants';
import { reply as activityStreamsReply } from './activitystreams';
import cheerio from 'cheerio';
import { fetchText } from 'util/crawler';
import { reply as webmentionReply } from '../pages/api/social/webmention';

export async function syndicate(
  req: NextApiRequest,
  contentOwner: User,
  localContent: Content,
  opt_remoteContent?: ContentRemote,
  opt_isComment?: boolean
) {
  if (localContent.hidden) {
    return;
  }

  // TODO(mime): redo
  // await webSubPush(req, localContent);

  // await parseMentions(req, contentOwner, localContent, opt_remoteContent);

  if (opt_isComment) {
    // const localContentUser = await getLocalUser(contentUrl(localContent, req), req);
    // emailComment(
    //   req,
    //   opt_remoteContent.username,
    //   opt_remoteContent.comment_user,
    //   localContentUser.email,
    //   contentUrl(localContent, req),
    //   opt_remoteContent
    // );
  }
}

// TODO(mime): redo
// function findMentionsInDraftJS(draftJsContent) {
//   const contentState = convertFromRaw(JSON.parse(draftJsContent));

//   return Object.keys(contentState.entityMap)
//     .map((key) => contentState.getEntity(contentState.entityMap[key]))
//     .filter((entity) => entity.type === 'mention' || entity.type === 'rsvp')
//     .map((entity) => entity.data.mention.link);
// }

// TODO(mime)
export async function parseMentions(
  req: NextApiRequest,
  contentOwner: User,
  content: Content,
  opt_remoteContent?: ContentRemote
) {
  const remoteUsers: UserRemote[] = [];
  const mentionedRemoteUsers: UserRemote[] = [];

  async function addToUsersList(userRemote: UserRemote, threadUrl?: string, shouldAddToMentions?: boolean) {
    if (!userRemote && threadUrl) {
      const webpage = await fetchText(threadUrl);
      const $ = cheerio.load(webpage);
      let webmentionUrl = $('link[rel="webmention"]').attr('href') || '';
      webmentionUrl = ensureAbsoluteUrl(threadUrl, webmentionUrl);

      // TODO(mime): pretty funky smell. refactor.
      if (webmentionUrl) {
        // @ts-ignore meh.
        userRemote = {
          webmentionUrl,
        };
      }
    }

    if (!userRemote || remoteUsers.find((el) => el.profileUrl === userRemote.profileUrl)) {
      return;
    }

    if (userRemote.salmonUrl || userRemote.activityPubInboxUrl || userRemote.webmentionUrl) {
      remoteUsers.push(userRemote);
      shouldAddToMentions && mentionedRemoteUsers.push(userRemote);
    }
  }

  // Add user from original thread as mentioned user.
  if (content.thread) {
    const threadContent = await getRemoteContent(content.username, content.thread);
    let threadUserRemote;
    if (threadContent) {
      threadUserRemote = await getRemoteUser(content.username, threadContent.fromUsername || '');
    }
    threadUserRemote && (await addToUsersList(threadUserRemote, content.thread, true));
  }

  // Find mentions in the text.
  // TODO(mime): support @blah@blah.com
  // TODO(mime) fix up completely
  const mentions: string[] = []; // (content.content && findMentionsInDraftJS(content.content)) || [];
  for (const mention of mentions) {
    const userRemote = await getRemoteUser(content.username, mention);
    userRemote && (await addToUsersList(userRemote, undefined /* threadUrl */, true));
  }

  // Find all users from the comments.
  if (content.commentsCount) {
    const comments = await getRemoteCommentsOnLocalContent(contentUrl(content, req));
    for (const comment of comments) {
      const userRemote = await getRemoteUser(content.username, comment.fromUsername || '');
      userRemote && (await addToUsersList(userRemote, undefined /* threadUrl */, false));
    }
  }

  if (opt_remoteContent) {
    // Find mentions in the comment text.
    // TODO(mime): support @blah@blah.com
    // TODO(mime) fix up completely
    const mentions: string[] = []; //(opt_remoteContent.content && findMentionsInDraftJS(opt_remoteContent.content)) || [];
    for (const mention of mentions) {
      const userRemote = await getRemoteUser(content.username, mention);
      userRemote && (await addToUsersList(userRemote, undefined /* threadUrl */, true));
    }
  }

  for (const userRemote of remoteUsers) {
    if (userRemote.activityPubInboxUrl || userRemote.salmonUrl) {
      activityStreamsReply(req, contentOwner, content, userRemote, mentionedRemoteUsers);
    } else if (userRemote.webmentionUrl) {
      webmentionReply(req, contentOwner, content, userRemote, mentionedRemoteUsers);
    }
  }
}

// TODO(mime)
export async function webSubPush(req: NextApiRequest, content: Content) {
  try {
    await fetch(WEB_SUB_HUB, {
      method: 'POST',
      body: new URLSearchParams({ 'hub.url': contentUrl(content, req), 'hub.mode': 'publish' }),
    });
  } catch (ex) {
    // Not a big deal if this fails.
  }
}
