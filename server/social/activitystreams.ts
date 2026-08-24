import type { Content, ContentRemote, User, UserRemote } from '../../generated/prisma/client';
import { buildUrl, contentUrl, profileUrl } from '../../lib/url-factory';
import { getActivityPubActor, getUserRemoteInfo } from './discover-user';
import {
  getLocalContent,
  getRemoteContent,
  getRemoteUser,
  getRemoteUserByActor,
  removeRemoteContent,
  removeRemoteContentByPostId,
  removeRemoteUser,
  saveRemoteContent,
  saveRemoteUser,
} from './db';
import crypto from 'crypto';
import { fetchJSON, sanitizeHTML } from '../crawler';
import { entryContentHtml } from './xml';
import { decryptSecret } from '../secrets';
import magic from 'magic-signatures';
import { nanoid } from 'nanoid';

// Acknowledges an inbound Follow. The object must be the Follow activity we
// received, verbatim — that's what the follower matches against its pending
// request to move the follow out of "requested".
export async function accept(host: string, contentOwner: User, userRemote: UserRemote, followActivity: GenericMessage) {
  const id = buildUrl({
    host,
    pathname: '/api/social/activitypub/accept',
    searchParams: { id: nanoid(10), resource: userRemote.profileUrl },
  });
  const message = createGenericMessage('Accept', host, id, contentOwner, followActivity);
  await send(host, userRemote, contentOwner, message);
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
  isFollow: boolean
) {
  const followId = buildUrl({
    host,
    pathname: '/api/social/activitypub/follow',
    searchParams: { id: nanoid(10), resource: userRemote.profileUrl },
  });
  const followMessage = createGenericMessage('Follow', host, followId, contentOwner, userRemote.profileUrl);
  const message = isFollow
    ? followMessage
    : createGenericMessage(
        'Undo',
        host,
        buildUrl({
          host,
          pathname: '/api/social/activitypub/undo',
          searchParams: { id: nanoid(10), resource: userRemote.profileUrl },
        }),
        contentOwner,
        followMessage
      );
  send(host, userRemote as UserRemote, contentOwner, message);
}

export async function reply(
  host: string,
  contentOwner: User,
  content: Content,
  userRemote: UserRemote,
  mentionedRemoteUsers: UserRemote[]
) {
  const message = await createNote(host, content, contentOwner, mentionedRemoteUsers);
  send(host, userRemote, contentOwner, message);
}

async function send(host: string, userRemote: UserRemote, contentOwner: User, message: GenericMessage) {
  try {
    if (userRemote?.activityPubInboxUrl || userRemote?.sharedInboxUrl) {
      await activityPubSend(host, userRemote, contentOwner, message);
    } else if (userRemote?.salmonUrl) {
      await salmonSend(userRemote, contentOwner, message);
    }
  } catch {
    // Not a big deal if this fails.
  }
}

// Fan one activity out to many recipients.
//
// Awaited, not floated: this runs on Vercel, where the function is frozen the
// moment the response is returned — a dangling promise silently never sends.
// One dead peer must not fail the others, hence the per-recipient catch.
export async function deliver(
  host: string,
  contentOwner: User,
  recipients: UserRemote[],
  message: GenericMessage
): Promise<void> {
  const results = await Promise.allSettled(
    recipients.map((userRemote) => send(host, userRemote, contentOwner, message))
  );
  const failed = results.filter((result) => result.status === 'rejected').length;
  if (failed) {
    console.debug(
      `${contentOwner.username}: ${message.type} delivered to ${recipients.length - failed}/${recipients.length} inboxes.`
    );
  }
}

export async function salmonSend(userRemote: UserRemote, contentOwner: User, msg: GenericMessage) {
  const data = JSON.stringify(msg);
  const body = magic.sign({ data, data_type: 'application/ld+json' }, decryptSecret(contentOwner.privateKey));
  body.sigs[0].value = magic.btob64u(body.sigs[0].value);

  await fetch(userRemote.salmonUrl || '', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/magic-envelope+json' },
  });
}

export const ACTIVITY_JSON = 'application/activity+json';
export const USER_AGENT = 'Hello-world (+https://github.com/mimecuvalo/helloworld)';

// The actor id every outbound activity is attributed to, and the subject of the
// keyId we sign with. Derived in several places; keep them agreeing.
export function actorUrlFor(host: string, localUser: Pick<User, 'username'>): string {
  return buildUrl({
    host,
    pathname: '/api/social/activitypub/actor',
    searchParams: { resource: profileUrl(localUser.username, host) },
  });
}

export function sha256Digest(body: string): string {
  return `SHA-256=${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}`;
}

// Builds the signed headers for one POST to one inbox.
//
// The signature covers `(request-target) host date digest content-type`. The
// digest is what makes the *body* tamper-evident — signing only
// `(request-target) host date`, as this used to, authenticates the request line
// and nothing else, and Mastodon rejects a delivery whose body isn't covered.
export function signRequest(host: string, contentOwner: User, targetUrl: string, body: string) {
  const currentDate = new Date();
  const target = new URL(targetUrl);
  const digest = sha256Digest(body);
  const date = currentDate.toUTCString();
  const headerNames = '(request-target) host date digest content-type';
  const signingString = [
    `(request-target): post ${target.pathname}${target.search}`,
    `host: ${target.host}`,
    `date: ${date}`,
    `digest: ${digest}`,
    `content-type: ${ACTIVITY_JSON}`,
  ].join('\n');

  const signature = crypto
    .createSign('sha256')
    .update(signingString)
    .end()
    .sign(decryptSecret(contentOwner.privateKey))
    .toString('base64');
  // The fragment matters: the actor document publishes its key as
  // `<actor>#main-key`, and a keyId that doesn't match what it advertises makes
  // some implementations refuse to resolve the key at all.
  const keyId = `${actorUrlFor(host, contentOwner)}#main-key`;

  return {
    Host: target.host,
    Date: date,
    Digest: digest,
    'Content-Type': ACTIVITY_JSON,
    Accept: ACTIVITY_JSON,
    'User-Agent': USER_AGENT,
    Signature: `keyId="${keyId}",algorithm="rsa-sha256",headers="${headerNames}",signature="${signature}"`,
  };
}

async function activityPubSend(host: string, userRemote: UserRemote, contentOwner: User, message: GenericMessage) {
  const inbox = userRemote.sharedInboxUrl || userRemote.activityPubInboxUrl || '';
  // Serialize once: the digest has to cover the exact bytes that get sent.
  const body = JSON.stringify(message);

  try {
    await fetch(inbox, { method: 'POST', body, headers: signRequest(host, contentOwner, inbox, body) });
  } catch {
    // Not a big deal if this fails.
  }
}

type GenericMessage = {
  '@context': string;
  type: string;
  id: string;
  actor: string;
  to: string[];
  cc?: string[];
  object: Activity | GenericMessage | string;
};

export function createGenericMessage(
  type: string,
  host: string,
  id: string,
  localUser: User,
  object: Activity | GenericMessage | string,
  opt_follower?: UserRemote[]
): GenericMessage {
  const actor = actorUrlFor(host, localUser);

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

export const PUBLIC_AUDIENCE = 'https://www.w3.org/ns/activitystreams#Public';

export function followersUrlFor(host: string, localUser: Pick<User, 'username'>): string {
  return buildUrl({
    host,
    pathname: '/api/social/activitypub/followers',
    searchParams: { resource: profileUrl(localUser.username, host) },
  });
}

// The AS2 object for a local piece of content.
//
// It's a Note, not an Article: Mastodon and most of its forks render Note
// reliably, while Article support is inconsistent — some clients show only a
// bare link, some show nothing. A blog post keeps its title by leading the
// content with a linked heading instead.
//
// Deliberately no `summary`: Mastodon reads summary as a content warning and
// would collapse every post behind one.
export async function createNoteObject(host: string, localContent: Content, localUser: User): Promise<Activity> {
  const messageUrl = buildUrl({
    host,
    pathname: '/api/social/activitypub/message',
    searchParams: { resource: contentUrl(localContent, undefined, host) },
  });
  const permalink = contentUrl(localContent, undefined, host);
  const isComment = localContent.section === 'comments';
  const view = entryContentHtml(host, localContent);
  const heading =
    !isComment && localContent.title ? `<p><a href="${permalink}"><strong>${localContent.title}</strong></a></p>` : '';

  let inReplyTo = localContent.thread || '';
  if (localContent.thread) {
    try {
      const activityObject = (await fetchJSON(localContent.thread, {
        Accept: ACTIVITY_JSON,
      })) as unknown as Activity;
      if (activityObject) {
        inReplyTo = activityObject.id;
      }
    } catch {
      /* do nothing */
    }
  }

  return {
    id: messageUrl,
    url: permalink,
    type: 'Note',
    published: new Date(localContent.createdAt || '').toISOString(),
    updated: new Date(localContent.updatedAt || '').toISOString(),
    attributedTo: actorUrlFor(host, localUser),
    inReplyTo,
    title: localContent.title,
    content: heading + view,
    attachment: localContent.thumb
      ? [{ type: 'Image', url: buildUrl({ host, pathname: localContent.thumb }), name: localContent.title }]
      : undefined,
    to: [PUBLIC_AUDIENCE],
    cc: [followersUrlFor(host, localUser)],
  };
}

export async function createNote(host: string, localContent: Content, localUser: User, opt_follower?: UserRemote[]) {
  const activityObject = await createNoteObject(host, localContent, localUser);
  return createGenericMessage('Create', host, activityObject.id, localUser, activityObject, opt_follower);
}

export type Activity = {
  id: string;
  url: string;
  type: string;
  content?: string;
  title?: string;
  name?: string;
  published?: string;
  updated?: string;
  to?: string | string[];
  cc?: string[];
  attachment?: { type: string; mediaType?: string; url: string; name?: string }[];
  tag?: { type: string; href: string; name: string }[];
  repliesCount?: string;
  repliesUpdated?: string;
  attributedTo?: string;
  inReplyTo?: string;
  displayName?: string;
};

// An activity's `object` is either an embedded object or a bare id string;
// callers that need one shape or the other go through these.
function objectOf(activity: GenericMessage): Activity | GenericMessage | null {
  return typeof activity.object === 'object' && activity.object !== null
    ? (activity.object as Activity | GenericMessage)
    : null;
}

function objectIdOf(activity: GenericMessage): string {
  return typeof activity.object === 'string' ? activity.object : (objectOf(activity) as Activity)?.id || '';
}

export async function handle(type: string, host: string, activity: GenericMessage, user: User, userRemote: UserRemote) {
  switch (type) {
    // The peer accepted (or refused) a Follow we sent.
    case 'Accept':
      await saveRemoteUser(Object.assign({}, userRemote, { following: true }));
      break;
    case 'Reject':
      await handleReject(userRemote);
      break;
    case 'Create':
      await handleCreate(host, activity, user, userRemote);
      break;
    // An edit of something we already stored: same mapping, upserted.
    case 'Update':
      await handleCreate(host, activity, user, userRemote);
      break;
    case 'Follow':
      await handleFollow(user, userRemote, true);
      break;
    case 'Like':
      await handleLike(activity, userRemote, true);
      break;
    case 'Announce':
      await handleAnnounce(activity, user, userRemote);
      break;
    case 'Delete':
      await handleDelete(activity, user, userRemote);
      break;
    // Undo carries the activity being retracted; unfollows and unlikes both
    // arrive this way, which is why handleFollow/handleLike take a boolean.
    case 'Undo': {
      const undone = objectOf(activity);
      if (undone?.type === 'Follow') await handleFollow(user, userRemote, false);
      else if (undone?.type === 'Like') await handleLike(undone as GenericMessage, userRemote, false);
      break;
    }
    default:
      break;
  }
}

async function handleReject(userRemote: UserRemote) {
  if (userRemote.follower) {
    await saveRemoteUser(Object.assign({}, userRemote, { following: false }));
  } else {
    await removeRemoteUser(userRemote);
  }
}

// Delete of the actor itself drops the peer; delete of a post drops that row.
async function handleDelete(activity: GenericMessage, user: User, userRemote: UserRemote) {
  const objectId = objectIdOf(activity);
  if (!objectId) return;

  if (objectId === activity.actor || objectId === userRemote.activityPubActorUrl) {
    await removeRemoteUser(userRemote);
    return;
  }
  await removeRemoteContentByPostId(user.username, objectId);
}

// A boost. The object is usually a bare URI, so fetch the original to get
// something worth showing; if that fails there's nothing to store.
async function handleAnnounce(activity: GenericMessage, user: User, userRemote: UserRemote) {
  const objectId = objectIdOf(activity);
  if (!objectId) return;

  let announced = objectOf(activity) as Activity | null;
  if (!announced?.content) {
    try {
      announced = (await fetchJSON(objectId, { Accept: ACTIVITY_JSON })) as unknown as Activity;
    } catch {
      return;
    }
  }
  if (!announced) return;

  const postId = `${objectId},announce`;
  if (await getRemoteContent(user.username, postId)) return;

  await saveRemoteContent({
    id: -1,
    avatar: userRemote.avatar,
    commentsCount: 0,
    commentsUpdated: null,
    createdAt: new Date(announced.published || new Date()),
    updatedAt: new Date(announced.updated || announced.published || new Date()),
    fromUsername: userRemote.profileUrl,
    fromUserRemoteId: userRemote.id.toString(),
    creator: userRemote.name,
    link: announced.url || objectId,
    postId,
    title: announced.title || announced.name || '',
    toUsername: user.username,
    type: 'post',
    username: userRemote.username,
    view: sanitizeHTML(announced.content || ''),
  } as unknown as ContentRemote);
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
