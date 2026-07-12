import type { Content, ContentRemote, User, UserRemote } from '../../generated/prisma/client';
import { buildUrl, contentUrl, profileUrl } from '../../lib/url-factory';
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
import { fetchJSON, sanitizeHTML } from '../crawler';
import magic from 'magic-signatures';
import { nanoid } from 'nanoid';

export async function accept(host: string, contentOwner: User, userRemote: UserRemote, body: string) {
  const id = buildUrl({
    host,
    pathname: '/api/social/activitypub/accept',
    searchParams: { id: nanoid(10), resource: body },
  });
  const message = createGenericMessage('Accept', host, id, contentOwner, body);
  send(host, userRemote, contentOwner, message);
}

export async function like(
  host: string,
  contentOwner: User,
  contentRemote: ContentRemote,
  userRemote: UserRemote,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isFavorite: boolean
) {
  const id = buildUrl({
    host,
    pathname: '/api/social/activitypub/like',
    searchParams: { id: nanoid(10), resource: contentRemote.link },
  });
  const message = createGenericMessage('Like', host, id, contentOwner, {
    type: 'Post',
    id: contentRemote.link,
    displayName: contentRemote.title,
    url: contentRemote.link,
  } as unknown as Activity);
  send(host, userRemote, contentOwner, message);
}

export async function follow(
  host: string,
  contentOwner: User,
  userRemote: Pick<UserRemote, 'profileUrl'>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isFollow: boolean
) {
  const id = buildUrl({
    host,
    pathname: '/api/social/activitypub/follow',
    searchParams: { id: nanoid(10), resource: userRemote.profileUrl },
  });
  const message = createGenericMessage('Follow', host, id, contentOwner, userRemote.profileUrl);
  send(host, userRemote as UserRemote, contentOwner, message);
}

export async function reply(
  host: string,
  contentOwner: User,
  content: Content,
  userRemote: UserRemote,
  mentionedRemoteUsers: UserRemote[]
) {
  const message = await createArticle(host, content, contentOwner, mentionedRemoteUsers);
  send(host, userRemote, contentOwner, message);
}

async function send(host: string, userRemote: UserRemote, contentOwner: User, message: GenericMessage) {
  try {
    if (userRemote?.activityPubInboxUrl) {
      activityPubSend(host, userRemote, contentOwner, message);
    } else if (userRemote?.salmonUrl) {
      salmonSend(userRemote, contentOwner, message);
    }
  } catch {
    // Not a big deal if this fails.
  }
}

export async function salmonSend(userRemote: UserRemote, contentOwner: User, msg: GenericMessage) {
  const data = JSON.stringify(msg);
  const body = magic.sign({ data, data_type: 'application/ld+json' }, contentOwner.privateKey);
  body.sigs[0].value = magic.btob64u(body.sigs[0].value);

  await fetch(userRemote.salmonUrl || '', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/magic-envelope+json' },
  });
}

async function activityPubSend(host: string, userRemote: UserRemote, contentOwner: User, message: GenericMessage) {
  const { currentDate, signatureHeader } = signMessage(host, contentOwner, userRemote);
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
  } catch {
    // Not a big deal if this fails.
  }
}

function signMessage(host: string, contentOwner: User, userRemote: UserRemote) {
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
    host,
    pathname: '/api/social/activitypub/actor',
    searchParams: { resource: profileUrl(contentOwner.username, host) },
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
  host: string,
  id: string,
  localUser: User,
  object: Activity | string,
  opt_follower?: UserRemote[]
): GenericMessage {
  const actor = buildUrl({
    host,
    pathname: '/api/social/activitypub/actor',
    searchParams: { resource: profileUrl(localUser.username, host) },
  });

  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type,
    id,
    actor,
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: opt_follower ? opt_follower.map((f) => f.profileUrl) : undefined,
    object,
  };
}

export async function createArticle(host: string, localContent: Content, localUser: User, opt_follower?: UserRemote[]) {
  const messageUrl = buildUrl({
    host,
    pathname: '/api/social/activitypub/message',
    searchParams: { resource: contentUrl(localContent, undefined, host) },
  });
  const actorUrl = buildUrl({
    host,
    pathname: '/api/social/activitypub/actor',
    searchParams: { resource: profileUrl(localUser.username, host) },
  });
  const statsImgSrc = buildUrl({
    host,
    pathname: '/api/stats',
    searchParams: { resource: contentUrl(localContent, undefined, host) },
  });
  const statsImg = `<img src="${statsImgSrc}" />`;
  const absoluteUrlReplacement = buildUrl({ host, pathname: '/resource' });

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
    } catch {
      /* do nothing */
    }
  }

  const activityObject: Activity = {
    id: messageUrl,
    url: contentUrl(localContent, undefined, host),
    type: 'Article',
    published: new Date(localContent.createdAt || '').toISOString(),
    updated: new Date(localContent.updatedAt || '').toISOString(),
    attributedTo: actorUrl,
    inReplyTo,
    title: localContent.title,
    content: view,
    to: 'https://www.w3.org/ns/activitystreams#Public',
  };

  return createGenericMessage('Create', host, messageUrl, localUser, activityObject, opt_follower);
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

export async function handle(type: string, host: string, activity: GenericMessage, user: User, userRemote: UserRemote) {
  switch (type) {
    case 'Accept':
      break;
    case 'Create':
      await handleCreate(host, activity, user, userRemote);
      break;
    case 'Follow':
      await handleFollow(user, userRemote, true);
      break;
    case 'Like':
      await handleLike(activity, userRemote, true);
      break;
    default:
      break;
  }
}

export async function findUserRemote(json: { [key: string]: string }, user: User): Promise<UserRemote | null> {
  const actorUrl = json.actor;
  let userRemote = await getRemoteUserByActor(user.username, actorUrl);
  if (!userRemote) {
    const actorJSON = (await getActivityPubActor(actorUrl)) as unknown as Activity;
    if (actorJSON.url) {
      const userRemoteInfo = await getUserRemoteInfo(actorJSON.url, user.username);
      await saveRemoteUser(userRemoteInfo);
      userRemote = await getRemoteUser(user.username, actorJSON.url);
    } else {
      return null;
    }
  }
  return userRemote;
}

async function handleFollow(user: User, userRemote: UserRemote, isFollow: boolean) {
  if (isFollow) {
    await saveRemoteUser(Object.assign({}, userRemote, { follower: true }));
  } else {
    if (userRemote.following) {
      await saveRemoteUser(Object.assign({}, userRemote, { follower: false }));
    } else {
      await removeRemoteUser(userRemote);
    }
  }
}

async function handleLike(activity: GenericMessage, userRemote: UserRemote, isLike: boolean) {
  const localContentUrl = activity.object as Activity;
  const content = await getLocalContent(localContentUrl.inReplyTo || '');
  if (!content) return;
  const { username, name } = content;

  const postId = `${userRemote.profileUrl},${localContentUrl},favorite`;
  const remoteContent = {
    fromUsername: userRemote.profileUrl,
    localContentName: name,
    postId,
    toUsername: username,
    type: 'favorite',
    username: userRemote.username,
  };

  if (!isLike) {
    await removeRemoteContent(remoteContent as ContentRemote);
    return;
  }

  const existingFavorite = await getRemoteContent(username, postId);
  if (existingFavorite) return;

  await saveRemoteContent(
    Object.assign({}, remoteContent, {
      createdAt: new Date(),
      updatedAt: new Date(),
      link: '',
      title: '',
      view: '',
    }) as ContentRemote
  );
}

async function handleCreate(host: string, activity: GenericMessage, user: User, userRemote: UserRemote) {
  const activityObject = activity.object as Activity;
  const atomContent = sanitizeHTML(activityObject.content || '');

  const existingContentRemote = await getRemoteContent(user.username, activityObject.id.toString());

  const contentRemote = {
    id: existingContentRemote?.id || -1,
    avatar: userRemote.avatar,
    commentsCount: parseInt(activityObject.repliesCount || '') || 0,
    commentsUpdated: new Date(activityObject.repliesUpdated || new Date()),
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
  } as unknown as ContentRemote;

  if (activityObject.inReplyTo) {
    await handleComment(contentRemote, activityObject.inReplyTo);
  } else {
    await handlePost(contentRemote);
  }
}

async function handlePost(contentRemote: ContentRemote) {
  contentRemote.type = 'post';
  await saveRemoteContent(contentRemote);
}

async function handleComment(contentRemote: ContentRemote, inReplyTo: string) {
  const content = await getLocalContent(inReplyTo);
  if (!content) return;
  contentRemote.type = 'comment';
  contentRemote.localContentName = content.name;
  await saveRemoteContent(contentRemote);
}
