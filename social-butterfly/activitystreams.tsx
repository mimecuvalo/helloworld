import { Content, ContentRemote, User, UserRemote } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { buildUrl, contentUrl, profileUrl } from 'util/url-factory';
import { getActivityPubActor, getUserRemoteInfo } from './discover-user';
import {
  getLocalContent,
  getRemoteContent,
  getRemoteUser,
  getRemoteUserByActor,
  removeRemoteContent,
  removeRemoteUser,
  saveRemoteContent,
  saveRemoteUser,
} from './db';

import crypto from 'crypto';
// import { follow as emailFollow } from './email';
// import { mention as emailMention } from './email';
import { fetchJSON } from 'util/crawler';
import magic from 'magic-signatures';
import { nanoid } from 'nanoid';
import { sanitizeHTML } from 'util/crawler';

//import syndicate from './syndicate';

export async function accept(req: NextApiRequest, contentOwner: User, userRemote: UserRemote) {
  const id = buildUrl({
    req,
    pathname: '/api/social/activitypub/accept',
    searchParams: { id: nanoid(10), resource: req.body },
  });
  const message = createGenericMessage('Accept', req, id, contentOwner, req.body);
  send(req, userRemote, contentOwner, message);
}

export async function like(
  req: NextApiRequest,
  contentOwner: User,
  contentRemote: ContentRemote,
  userRemote: UserRemote,
  // eslint-disable-next-line
  isFavorite: boolean
) {
  // TODO(mime): add back unfavorite
  const id = buildUrl({
    req,
    pathname: '/api/social/activitypub/like',
    searchParams: { id: nanoid(10), resource: contentRemote.link },
  });
  const message = createGenericMessage('Like', req, id, contentOwner, {
    type: 'Post',
    id: contentRemote.link,
    displayName: contentRemote.title,
    url: contentRemote.link,
  });
  send(req, userRemote, contentOwner, message);
}

export async function follow(
  req: NextApiRequest,
  contentOwner: User,
  userRemote: Pick<UserRemote, 'profileUrl'>,
  // TODO(mime): add back unfollow
  // eslint-disable-next-line
  isFollow: boolean
) {
  const id = buildUrl({
    req,
    pathname: '/api/social/activitypub/follow',
    searchParams: { id: nanoid(10), resource: userRemote.profileUrl },
  });
  const message = createGenericMessage('Follow', req, id, contentOwner, userRemote.profileUrl);
  send(req, userRemote as UserRemote, contentOwner, message);
}

export async function reply(
  req: NextApiRequest,
  contentOwner: User,
  content: Content,
  userRemote: UserRemote,
  mentionedRemoteUsers: UserRemote[]
) {
  const message = await createArticle(req, content, contentOwner, mentionedRemoteUsers);
  send(req, userRemote, contentOwner, message);
}

async function send(req: NextApiRequest, userRemote: UserRemote, contentOwner: User, message: GenericMessage) {
  try {
    if (userRemote?.activityPubInboxUrl) {
      activityPubSend(req, userRemote, contentOwner, message);
    } else if (userRemote?.salmonUrl) {
      salmonSend(req, userRemote, contentOwner, message);
    }
  } catch (ex) {
    // Not a big deal if this fails.
    // TODO(mime): add logging later.
  }
}

export async function salmonSend(req: NextApiRequest, userRemote: UserRemote, contentOwner: User, msg: GenericMessage) {
  const data = JSON.stringify(msg);
  const body = magic.sign({ data, data_type: 'application/ld+json' }, contentOwner.privateKey);
  body.sigs[0].value = magic.btob64u(body.sigs[0].value);

  await fetch(userRemote.salmonUrl || '', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/magic-envelope+json' },
  });
}

async function activityPubSend(
  req: NextApiRequest,
  userRemote: UserRemote,
  contentOwner: User,
  message: GenericMessage
) {
  const { currentDate, signatureHeader } = signMessage(req, contentOwner, userRemote);
  const inboxUrl = new URL(userRemote.activityPubInboxUrl || '');

  try {
    await fetch(userRemote.activityPubInboxUrl || '', {
      method: 'POST',
      body: JSON.stringify(message),
      headers: {
        Host: inboxUrl.hostname,
        Date: currentDate.toUTCString(),
        Signature: signatureHeader,
        'Content-Type': 'application/ld+json',
      },
    });
  } catch (ex) {
    // Not a big deal if this fails.
    // TODO(mime): add logging later.
  }
}

function signMessage(req: NextApiRequest, contentOwner: User, userRemote: UserRemote) {
  const currentDate = new Date();
  const inboxUrl = new URL(userRemote.activityPubInboxUrl || '');
  const signer = crypto
    .createSign('sha256')
    .update(`(request-target): post ${inboxUrl.pathname}${inboxUrl.search}\n`)
    .update(`host: ${inboxUrl.hostname}\n`)
    .update(`date: ${currentDate.toUTCString()}`)
    .end();
  const signature = signer.sign(contentOwner.privateKey).toString('base64');
  const actorUrl = buildUrl({
    req,
    pathname: '/api/social/activitypub/actor',
    searchParams: { resource: profileUrl(contentOwner.username, req) },
  });
  const signatureHeader = `keyId="${actorUrl}",headers="(request-target) host date",signature="${signature}"`;

  return { currentDate, signatureHeader };
}

type GenericMessage = {
  '@context': string;
  type: string;
  id: string;
  actor: string;
  to: string[];
  cc?: string[];
  object: Activity | string;
};

export function createGenericMessage(
  type: string,
  req: NextApiRequest,
  id: string,
  localUser: User,
  object: Activity | string,
  opt_follower?: UserRemote[]
): GenericMessage {
  const actor = buildUrl({
    req,
    pathname: '/api/social/activitypub/actor',
    searchParams: { resource: profileUrl(localUser.username, req) },
  });

  const json = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type,
    id,
    actor,
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: opt_follower ? opt_follower.map((f) => f.profileUrl) : undefined,
    object,
  };

  return json;
}

export async function createArticle(
  req: NextApiRequest,
  localContent: Content,
  localUser: User,
  opt_follower?: UserRemote[]
) {
  const messageUrl = buildUrl({
    req,
    pathname: '/api/social/activitypub/message',
    searchParams: { resource: contentUrl(localContent, req) },
  });
  const actorUrl = buildUrl({
    req,
    pathname: '/api/social/activitypub/actor',
    searchParams: { resource: profileUrl(localUser.username, req) },
  });
  const statsImgSrc = buildUrl({
    req,
    pathname: '/api/stats',
    searchParams: { resource: contentUrl(localContent, req) },
  });
  const statsImg = `<img src="${statsImgSrc}" />`;
  const absoluteUrlReplacement = buildUrl({ req, pathname: '/resource' });

  // TODO(mime): this replacement is nite-lite specific...
  const view = localContent.view.replace(/(['"])\/resource/gm, `$1${absoluteUrlReplacement}`) + statsImg;

  let inReplyTo = localContent.thread || '';
  if (localContent.thread) {
    try {
      const activityObject = (await fetchJSON(localContent.thread, {
        Accept: 'application/activity+json',
      })) as unknown as Activity;
      if (activityObject) {
        inReplyTo = activityObject.id;
      }
    } catch (ex) {
      /* do nothing */
    }
  }

  const activityObject: Activity = {
    id: messageUrl,
    url: contentUrl(localContent, req),
    type: 'Article',
    published: new Date(localContent.createdAt || '').toISOString(),
    updated: new Date(localContent.updatedAt || '').toISOString(),
    attributedTo: actorUrl,
    inReplyTo,
    title: localContent.title,
    content: view,
    to: 'https://www.w3.org/ns/activitystreams#Public',
  };

  return createGenericMessage('Create', req, messageUrl, localUser, activityObject, opt_follower);
}

export type Activity = {
  id: string;
  url: string;
  type: string;
  content?: string;
  title?: string;
  published?: string;
  updated?: string;
  to?: string;
  repliesCount?: string;
  repliesUpdated?: string;
  attributedTo?: string;
  inReplyTo?: string;
  displayName?: string;
};

export async function handle(
  type: string,
  req: NextApiRequest,
  res: NextApiResponse,
  activity: GenericMessage,
  user: User,
  userRemote: UserRemote
) {
  switch (type) {
    case 'Accept':
      // Do nothing.
      break;
    case 'Create':
      await handleCreate(req, res, activity, user, userRemote);
      break;
    case 'Follow':
      await handleFollow(req, user, userRemote, true);
      break;
    case 'Like':
      await handleLike(req, res, activity, userRemote, true);
      break;
    default:
      break;
  }
}

export async function findUserRemote(json: { [key: string]: string }, res: NextApiResponse, user: User) {
  const actorUrl = json.actor;
  let userRemote = await getRemoteUserByActor(user.username, actorUrl);
  if (!userRemote) {
    const actorJSON = (await getActivityPubActor(actorUrl)) as unknown as Activity;
    if (actorJSON.url) {
      const userRemoteInfo = await getUserRemoteInfo(actorJSON.url, user.username);
      await saveRemoteUser(userRemoteInfo);
      userRemote = await getRemoteUser(user.username, actorJSON.url);
    } else {
      res.status(400).end();
      return;
    }
  }

  return userRemote;
}

async function handleFollow(req: NextApiRequest, user: User, userRemote: UserRemote, isFollow: boolean) {
  if (isFollow) {
    await saveRemoteUser(Object.assign({}, userRemote, { follower: true }));
    //emailFollow(req, user.username, user.email, userRemote.profileUrl);
  } else {
    if (userRemote.following) {
      await saveRemoteUser(Object.assign({}, userRemote, { follower: false }));
    } else {
      await removeRemoteUser(userRemote);
    }
  }
}

async function handleLike(
  req: NextApiRequest,
  res: NextApiResponse,
  activity: GenericMessage,
  userRemote: UserRemote,
  isLike: boolean
) {
  const localContentUrl = activity.object as Activity;
  const content = await getLocalContent(localContentUrl.inReplyTo || '');

  if (!content) {
    return res.status(400).end();
  }
  const { username, name } = content;

  const postId = `${userRemote.profileUrl},${localContentUrl},favorite`;
  const remoteContent = {
    fromUsername: userRemote.profileUrl,
    localContentName: name,
    postId: postId,
    toUsername: username,
    type: 'favorite',
    username: userRemote.username,
  };

  if (!isLike) {
    await removeRemoteContent(remoteContent as ContentRemote);
    return;
  }

  const existingFavorite = await getRemoteContent(username, postId);
  if (existingFavorite) {
    return;
  }

  await saveRemoteContent(
    Object.assign({}, remoteContent, {
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      link: '',
      title: '',
      view: '',
    }) as ContentRemote
  );
}

async function handleCreate(
  req: NextApiRequest,
  res: NextApiResponse,
  activity: GenericMessage,
  user: User,
  userRemote: UserRemote
) {
  const activityObject = activity.object as Activity;
  const atomContent = sanitizeHTML(activityObject.content || '');

  const existingContentRemote = await getRemoteContent(user.username, activityObject.id.toString());

  // @ts-ignore it's fine.
  const contentRemote: ContentRemote = {
    id: existingContentRemote?.id || -1,
    avatar: userRemote.avatar,
    commentsCount: parseInt(activityObject.repliesCount || ''),
    commentsUpdated: new Date(activityObject.repliesUpdated || new Date()),
    content: '',
    createdAt: new Date(activityObject.published || new Date()),
    fromUsername: userRemote.profileUrl,
    fromUserRemoteId: userRemote.id.toString(),
    creator: userRemote.name,
    link: activityObject.id,
    postId: activityObject.id,
    title: activityObject.title || '',
    toUsername: user.username,
    updatedAt: new Date(activityObject.updated || new Date()),
    username: userRemote.username,
    view: atomContent,
  };

  if (activityObject.inReplyTo) {
    handleComment(req, res, contentRemote, activityObject.inReplyTo);
  } else {
    handlePost(req, res, contentRemote, user, activityObject);
  }

  //const repliesCount = activityObject.repliesCount;
  // if (repliesCount) {
  //   // TODO(mime): these used to be known as 'remote-comment' types.
  //   // need to refactor this.
  //   const comments = await retrieveFeed(activityObject.repliesLink);
  //   await parseFeedAndInsertIntoDb(salmon, userRemote, comments);
  // }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  contentRemote: ContentRemote,
  user: User,
  activityObject: { [key: string]: string }
) {
  // TODO(mime): need to unify this with activitypub.js, currently salmon specific...
  const wasUserMentioned = activityObject.mentioned || activityObject.attention;

  contentRemote.type = 'post';
  await saveRemoteContent(contentRemote);

  if (wasUserMentioned) {
    //emailMention(req, 'Remote User', undefined /* fromEmail */, user.email, contentRemote.link);
  }
}

async function handleComment(
  req: NextApiRequest,
  res: NextApiResponse,
  contentRemote: ContentRemote,
  inReplyTo: string
) {
  const content = await getLocalContent(inReplyTo);
  if (!content) {
    return res.status(404).end();
  }

  contentRemote.type = 'comment';
  contentRemote.localContentName = content.name;
  await saveRemoteContent(contentRemote);

  //const contentOwner = await getLocalUser(inReplyTo, req);

  // TODO(mime): fix
  //await syndicate(req, contentOwner, content, contentRemote, true /* isComment */);
}
