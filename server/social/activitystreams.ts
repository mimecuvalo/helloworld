import type { Content, ContentRemote, User, UserRemote } from '../../generated/prisma/client';
import * as cheerio from 'cheerio';
import { apUrl, buildUrl, contentUrl, profileUrl } from '../../lib/url-factory';
import { THUMB_HEIGHT, THUMB_WIDTH } from '../../util/constants';
import { getActivityPubActor, getUserRemoteInfo } from './discover-user';
import {
  ensureEd25519Key,
  getLocalContent,
  getLocalUserByUsername,
  getRemoteContent,
  getRemoteUser,
  getRemoteUserByActor,
  removeRemoteContent,
  removeRemoteContentByPostId,
  removeRemoteUser,
  saveRemoteContent,
  saveRemoteUser,
  type ReplyStats,
} from './db';
import crypto from 'crypto';
import { sanitizeHTML } from '../crawler';
import { ACTIVITY_JSON, USER_AGENT, fetchActivityJson } from './signed-fetch';
import { entryContentHtml } from './xml';
import { decryptSecret } from '../secrets';
import {
  addIntegrityProof,
  assertionKeyOf,
  DATA_INTEGRITY_CONTEXT,
  MULTIKEY_CONTEXT,
  publicKeyMultibaseOf,
  withProofContext,
  type IntegrityProof,
} from './integrity-proof';
import forge from 'node-forge';
import {
  dropDelivery,
  dueDeliveries,
  enqueueDelivery,
  isGone,
  isPermanentFailure,
  pruneExhaustedDeliveries,
  rescheduleDelivery,
  retireInbox,
} from './delivery-queue';
import magic from 'magic-signatures';
import { nanoid } from 'nanoid';

// Acknowledges an inbound Follow. The object must be the Follow activity we
// received, verbatim — that's what the follower matches against its pending
// request to move the follow out of "requested".
export async function accept(host: string, contentOwner: User, userRemote: UserRemote, followActivity: GenericMessage) {
  const message = createGenericMessage(
    'Accept',
    host,
    activityUrlFor(host, contentOwner),
    contentOwner,
    followActivity
  );
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
  const message = createGenericMessage('Like', host, activityUrlFor(host, contentOwner), contentOwner, {
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
  const followMessage = createGenericMessage(
    'Follow',
    host,
    activityUrlFor(host, contentOwner),
    contentOwner,
    userRemote.profileUrl
  );
  const message = isFollow
    ? followMessage
    : createGenericMessage('Undo', host, activityUrlFor(host, contentOwner), contentOwner, followMessage);
  send(host, userRemote as UserRemote, contentOwner, message);
}

// One delivery to one peer.
//
// `unsigned` is the same activity without its integrity proof, kept so that a
// failure can be queued: both signatures expire, so what gets stored has to be
// the payload, not the signed bytes. See the Delivery model.
async function send(
  host: string,
  userRemote: UserRemote,
  contentOwner: User,
  message: GenericMessage,
  unsigned?: GenericMessage
) {
  try {
    if (userRemote?.activityPubInboxUrl || userRemote?.sharedInboxUrl) {
      const inbox = inboxOf(userRemote);
      // Idempotent: deliver() has already proofed a fan-out, but the one-off
      // senders above (follow, like, accept) come straight here unsigned.
      const signed = signActivity(host, contentOwner, message);
      const result = await activityPubSend(host, inbox, contentOwner, signed);
      if (!result.ok) await handleFailedDelivery(contentOwner, inbox, signed, unsigned || message, result);
    } else if (userRemote?.salmonUrl) {
      // Salmon has its own envelope signature and predates all of this; a
      // magic-envelope peer has no idea what a `proof` is. Not queued either:
      // there is no status code to reason about in a magic envelope.
      await salmonSend(userRemote, contentOwner, message);
    }
  } catch (ex) {
    // A peer being unreachable is routine. Being unable to *sign* is not — it
    // means the key is unreadable (usually a wrong or missing SECRETS_KEY), and
    // every delivery will fail the same way. Swallowing that silently is what
    // makes it take an afternoon to notice, so say so.
    console.error(
      `${contentOwner.username}: ${message.type} to ${userRemote?.profileUrl} failed.\n${(ex as Error)?.message || ex}`
    );
  }
}

export function inboxOf(userRemote: UserRemote): string {
  return userRemote.sharedInboxUrl || userRemote.activityPubInboxUrl || '';
}

// What to do about a delivery that didn't land: retire the peer, give up, or
// queue it for the cron to try again.
async function handleFailedDelivery(
  contentOwner: User,
  inbox: string,
  message: GenericMessage,
  unsigned: GenericMessage,
  result: { status: number; error: string }
) {
  if (isGone(result.status)) {
    await retireInbox(inbox);
    return;
  }
  if (isPermanentFailure(result.status)) {
    console.error(`${contentOwner.username}: ${message.type} refused by ${inbox} (${result.status}); not retrying.`);
    return;
  }

  await enqueueDelivery({
    username: contentOwner.username,
    inboxUrl: inbox,
    activityId: message.id,
    message: JSON.stringify(unsigned),
  });
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
  // Signed once for the whole fan-out rather than per recipient: the proof
  // covers the document, so every inbox gets identical bytes — and signActivity
  // leaves an already-proofed message alone when send() sees it again.
  const signed = signActivity(host, contentOwner, message);
  const results = await Promise.allSettled(
    recipients.map((userRemote) => send(host, userRemote, contentOwner, signed, message))
  );
  const failed = results.filter((result) => result.status === 'rejected').length;
  if (failed) {
    console.debug(
      `${contentOwner.username}: ${message.type} delivered to ${recipients.length - failed}/${recipients.length} inboxes.`
    );
  }
}

// Works through the deliveries that earlier attempts couldn't complete.
//
// Re-signs each one from scratch: the stored payload is unsigned precisely
// because an HTTP signature is only valid inside a five-minute window and a
// FEP-8b32 proof carries its own `created`. Signing at send time is what makes
// a retry an hour later verifiable at all.
export async function runDeliveryQueue(
  host: string,
  limit = 50
): Promise<{ sent: number; retrying: number; dropped: number }> {
  const due = await dueDeliveries(limit);
  const users = new Map<string, User | null>();
  let sent = 0;
  let retrying = 0;
  let dropped = 0;

  for (const delivery of due) {
    if (!users.has(delivery.username)) {
      users.set(delivery.username, await getLocalUserByUsername(delivery.username));
    }
    const contentOwner = users.get(delivery.username) || null;

    let message: GenericMessage | null = null;
    try {
      message = JSON.parse(delivery.message) as GenericMessage;
    } catch {
      message = null;
    }

    // A user who has since been deleted, or a payload we can no longer read:
    // there is nothing left to send and nothing to be gained by trying again.
    if (!contentOwner || !message) {
      await dropDelivery(delivery.id);
      dropped++;
      continue;
    }

    const signingHost = contentOwner.hostname || host;
    const result = await activityPubSend(
      signingHost,
      delivery.inboxUrl,
      contentOwner,
      signActivity(signingHost, contentOwner, message)
    );

    if (result.ok) {
      await dropDelivery(delivery.id);
      sent++;
    } else if (isGone(result.status)) {
      await retireInbox(delivery.inboxUrl);
      dropped++;
    } else if (isPermanentFailure(result.status)) {
      await dropDelivery(delivery.id);
      dropped++;
    } else {
      await rescheduleDelivery(delivery, result.error);
      retrying++;
    }
  }

  dropped += await pruneExhaustedDeliveries();
  return { sent, retrying, dropped };
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

export { ACTIVITY_JSON, USER_AGENT };

// The actor id every outbound activity is attributed to, and the subject of the
// keyId we sign with. Derived in several places; keep them agreeing.
export function actorUrlFor(host: string, localUser: Pick<User, 'username'>): string {
  return apUrl(host, localUser.username);
}

export function inboxUrlFor(host: string, localUser: Pick<User, 'username'>): string {
  return apUrl(host, localUser.username, 'inbox');
}

export function outboxUrlFor(host: string, localUser: Pick<User, 'username'>): string {
  return apUrl(host, localUser.username, 'outbox');
}

export function followingUrlFor(host: string, localUser: Pick<User, 'username'>): string {
  return apUrl(host, localUser.username, 'following');
}

// One inbox for the whole site, addressed by nobody in particular. Peers that
// deliver the same activity to several of our users collapse it to one POST;
// the recipients are then read back out of the activity's own to/cc.
export function sharedInboxUrlFor(host: string): string {
  return apUrl(host, 'inbox');
}

// The AS2 id of a local post. Distinct from its permalink (`url`): the
// permalink is the page a person reads, this is the document a peer fetches.
export function objectUrlFor(host: string, localContent: Pick<Content, 'username' | 'name'>): string {
  return apUrl(host, localContent.username, 'o', localContent.name);
}

// The actor document.
//
// Built here rather than inline in the route so that whatever eventually
// announces a profile change can send this exact document — what we serve and
// what we announce have to agree, or peers end up holding a profile we never
// published.
export async function createActorObject(host: string, user: User): Promise<Record<string, unknown>> {
  const actorUrl = actorUrlFor(host, user);

  let publicKeyPem = '';
  try {
    publicKeyPem = forge.pki.publicKeyToPem(magic.magicToRSA(user.magicKey));
  } catch {
    // user has no magic key yet
  }

  // The Ed25519 key for FEP-8b32 proofs, minted on first publication. Separate
  // from publicKey above, which is RSA and signs HTTP requests: `assertionMethod`
  // is what a verifier resolves a proof's verificationMethod against.
  let assertionMethod: object[] | undefined;
  try {
    assertionMethod = [
      {
        id: assertionMethodIdFor(host, user),
        type: 'Multikey',
        controller: actorUrl,
        publicKeyMultibase: publicKeyMultibaseOf(decryptSecret(await ensureEd25519Key(user))),
      },
    ];
  } catch {
    // Unreadable SECRETS_KEY. The RSA half of the document still works, so
    // publish what we can rather than 500ing the whole actor.
  }

  const icon = user.logo || user.favicon;

  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
      DATA_INTEGRITY_CONTEXT,
      MULTIKEY_CONTEXT,
      // `PropertyValue` is Schema.org, and Mastodon will drop the profile
      // fields below without it in scope.
      { schema: 'http://schema.org#', PropertyValue: 'schema:PropertyValue', value: 'schema:value' },
    ],
    id: actorUrl,
    type: 'Person',
    preferredUsername: user.username,
    name: user.name,
    summary: user.description || undefined,
    published: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
    // Mastodon reads these to decide whether to show a lock on the profile
    // and whether the account may be surfaced in directories.
    manuallyApprovesFollowers: false,
    discoverable: true,
    inbox: inboxUrlFor(host, user),
    outbox: outboxUrlFor(host, user),
    followers: followersUrlFor(host, user),
    following: followingUrlFor(host, user),
    endpoints: { sharedInbox: sharedInboxUrlFor(host) },
    url: profileUrl(user.username, host),
    icon: icon ? { type: 'Image', url: buildUrl({ host, pathname: icon }) } : undefined,
    // The linked fediverse profile, shown as a profile field. Mastodon marks it
    // verified when that profile links back with rel="me", which is the whole
    // point of storing it.
    attachment: user.mastodonUrl
      ? [
          {
            type: 'PropertyValue',
            name: 'Fediverse',
            value: `<a href="${user.mastodonUrl}" rel="me nofollow noopener">${user.mastodonUrl}</a>`,
          },
        ]
      : undefined,
    publicKey: { id: `${actorUrl}#main-key`, owner: actorUrl, publicKeyPem },
    assertionMethod,
  };
}

// The id of one activity we send. Opaque and not dereferenceable — nothing
// serves these — but it still has to be a unique absolute URI on our own
// origin, because that is what peers store and deduplicate on.
export function activityUrlFor(host: string, localUser: Pick<User, 'username'>): string {
  return apUrl(host, localUser.username, 'a', nanoid(12));
}

// Where the actor document publishes the Ed25519 key, and what a proof points
// back at. Distinct from `#main-key`, which is the RSA key for HTTP signatures.
export function assertionMethodIdFor(host: string, localUser: Pick<User, 'username'>): string {
  return `${actorUrlFor(host, localUser)}#ed25519-key`;
}

// Attaches a FEP-8b32 object integrity proof, if this user has an Ed25519 key.
//
// Best-effort on purpose. An account provisioned before object integrity proofs
// existed federates exactly as it did before — every direct delivery is still
// authenticated by its HTTP signature, and the proof only buys survival across
// a relay or an inbox forward. Failing to sign here must not cost the delivery.
export function signActivity(host: string, contentOwner: User, message: GenericMessage): GenericMessage {
  if (message.proof || !contentOwner.ed25519PrivateKey) return message;

  try {
    return addIntegrityProof(
      { ...message, '@context': withProofContext(message['@context']) },
      {
        verificationMethod: assertionMethodIdFor(host, contentOwner),
        privateKeyPem: decryptSecret(contentOwner.ed25519PrivateKey),
      }
    ) as GenericMessage;
  } catch (ex) {
    // Same reasoning as send()'s catch: an unreadable key fails identically
    // forever, so it has to be audible rather than silently unsigned.
    console.error(`${contentOwner.username}: could not attach an integrity proof.\n${(ex as Error)?.message || ex}`);
    return message;
  }
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
  // Surfaces a misconfigured SECRETS_KEY as itself rather than as an opaque
  // cipher error from deep inside the signing call.
  let privateKey: string;
  try {
    privateKey = decryptSecret(contentOwner.privateKey);
  } catch {
    throw new Error(
      `Cannot read ${contentOwner.username}'s private key — SECRETS_KEY is wrong or missing, so nothing can be signed.`
    );
  }
  if (!privateKey) throw new Error(`${contentOwner.username} has no private key; federation cannot be signed.`);

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

  const signature = crypto.createSign('sha256').update(signingString).end().sign(privateKey).toString('base64');
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

// Posts one activity to one inbox and reports what happened.
//
// The status matters: it used to be discarded along with any transport error
// ("Not a big deal if this fails"), which is exactly how a post silently failed
// to reach an inbox that happened to be restarting. Status 0 means the request
// never completed at all — DNS, TLS, timeout — which is retryable.
export async function activityPubSend(
  host: string,
  inbox: string,
  contentOwner: User,
  message: GenericMessage
): Promise<{ ok: boolean; status: number; error: string }> {
  // Serialize once: the digest has to cover the exact bytes that get sent.
  const body = JSON.stringify(message);

  try {
    const response = await fetch(inbox, {
      method: 'POST',
      body,
      headers: signRequest(host, contentOwner, inbox, body),
    });
    return {
      ok: response.ok,
      status: response.status,
      error: response.ok ? '' : `${response.status} ${response.statusText}`,
    };
  } catch (ex) {
    return { ok: false, status: 0, error: (ex as Error)?.message || String(ex) };
  }
}

export type GenericMessage = {
  // A string until a proof is attached, at which point the Data Integrity terms
  // are appended and it becomes an array.
  '@context': string | unknown[];
  type: string;
  id: string;
  actor: string;
  to: string[];
  cc?: string[];
  object: Activity | GenericMessage | string;
  proof?: IntegrityProof;
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
  return apUrl(host, localUser.username, 'followers');
}

// The Atom rendering has advertised its replies as `<link rel="replies">` with
// thr:count/thr:updated since the OStatus days; this is the same thing for
// ActivityPub, keyed by the post's own permalink so both point at one thread.
export function repliesUrlFor(host: string, localContent: Content): string {
  return `${objectUrlFor(host, localContent)}/replies`;
}

// Inlined rather than served as a bare URL: totalItems is what a client renders
// as the reply count, and inlining spares every peer a fetch per post just to
// discover a thread is empty. `first` is what they follow to read it.
function repliesCollectionFor(host: string, localContent: Content, stats: ReplyStats) {
  const repliesUrl = repliesUrlFor(host, localContent);
  return {
    id: repliesUrl,
    type: 'OrderedCollection',
    totalItems: stats.count,
    updated: stats.updated ? new Date(stats.updated).toISOString() : undefined,
    first: `${repliesUrl}?page=1`,
  };
}

// Mastodon indexes a post into a hashtag timeline from the `tag` array, not by
// re-reading the body, so a #word that never makes it into the tags is a word
// nobody can find. Text nodes only, for the same reason findMentions scans them:
// a `#` inside an href or a colour literal is not a tag.
const HASHTAG_REGEXP = /(?:^|\s)#([\p{L}\p{N}_][\p{L}\p{N}_-]*)/gu;

export function findHashtags(html: string): string[] {
  const tags = new Map<string, string>();

  try {
    const $ = cheerio.load(html);
    // Anchors the editor already marked up as tags win, since they carry the
    // author's own spelling.
    $('a.p-category, a.u-category, a.hashtag').each((_index, element) => {
      const name = ($(element).text() || '').replace(/^#/, '').trim();
      if (name) tags.set(name.toLowerCase(), name);
    });
    for (const match of ($.root().text() || '').matchAll(HASHTAG_REGEXP)) {
      // First spelling wins: #Fediverse and #fediverse are one tag, and the
      // author wrote one of them first.
      if (!tags.has(match[1].toLowerCase())) tags.set(match[1].toLowerCase(), match[1]);
    }
  } catch {
    /* malformed html — whatever we found so far still stands */
  }

  return [...tags.values()];
}

// A tag's href has to resolve to something: Mastodon links it, and a reader
// who clicks expects to land on the other posts carrying it. The site's own
// per-user search is that page.
function hashtagTagsFor(host: string, localContent: Content): { type: string; href: string; name: string }[] {
  return findHashtags(localContent.view).map((tag) => ({
    type: 'Hashtag',
    href: buildUrl({ host, pathname: `/${localContent.username}/search/${encodeURIComponent(tag)}` }),
    name: `#${tag}`,
  }));
}

const MEDIA_TYPES: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

// Clients decide whether they can render an attachment — and whether to reserve
// space for it before it loads — from mediaType and the dimensions. Without
// them Mastodon shows a generic file chip instead of the image.
function attachmentsFor(host: string, localContent: Content) {
  if (!localContent.thumb) return undefined;

  const url = buildUrl({ host, pathname: localContent.thumb });
  const extension = (localContent.thumb.split('.').pop() || '').toLowerCase();

  return [
    {
      type: 'Image',
      mediaType: MEDIA_TYPES[extension] || 'image/jpeg',
      url,
      // `name` is alt text, which we don't collect; the title is the closest
      // honest description we have of what the image is.
      name: localContent.title || undefined,
      width: THUMB_WIDTH,
      height: THUMB_HEIGHT,
    },
  ];
}

// The AS2 object for a local piece of content.
//
// It's a Note, not an Article: Mastodon and most of its forks render Note
// reliably, while Article support is inconsistent — some clients show only a
// bare link, some show nothing. A blog post keeps its title by leading the
// content with a linked heading instead.
//
// `summary` is emitted only for a post that actually carries a content warning:
// Mastodon reads any summary as a CW, so filling it in unconditionally would
// collapse every post behind one.
export async function createNoteObject(
  host: string,
  localContent: Content,
  localUser: User,
  replyStats: ReplyStats = { count: 0, updated: null },
  // Peers this post mentions, already resolved. Passed in rather than looked up
  // here so that the delivered copy and the copy served from /ap/:user/o/:name
  // carry the same tags — a mention that exists only in the delivery disappears
  // the moment anybody refetches the object.
  mentions: UserRemote[] = []
): Promise<Activity> {
  const permalink = contentUrl(localContent, undefined, host);
  const isComment = localContent.section === 'comments';
  const view = entryContentHtml(host, localContent);
  const heading =
    !isComment && localContent.title ? `<p><a href="${permalink}"><strong>${localContent.title}</strong></a></p>` : '';

  let inReplyTo = localContent.thread || '';
  if (localContent.thread) {
    try {
      const activityObject = (await fetchActivityJson(localContent.thread, {
        host,
        signer: localUser,
      })) as unknown as Activity;
      if (activityObject) {
        inReplyTo = activityObject.id;
      }
    } catch {
      /* do nothing */
    }
  }

  return {
    id: objectUrlFor(host, localContent),
    url: permalink,
    type: 'Note',
    published: new Date(localContent.createdAt || '').toISOString(),
    updated: new Date(localContent.updatedAt || '').toISOString(),
    attributedTo: actorUrlFor(host, localUser),
    inReplyTo,
    title: localContent.title,
    content: heading + view,
    // A warning implies the flag, so a post that has one is sensitive whether or
    // not the column says so.
    sensitive: localContent.sensitive || !!localContent.contentWarning || undefined,
    summary: localContent.contentWarning || undefined,
    attachment: attachmentsFor(host, localContent),
    tag: [...hashtagTagsFor(host, localContent), ...mentionTagsFor(mentions)],
    replies: repliesCollectionFor(host, localContent, replyStats),
    to: [PUBLIC_AUDIENCE],
    cc: [followersUrlFor(host, localUser), ...mentions.map(actorIdOf)],
  };
}

// Addressed by actor id, not profile page: Mastodon registers a mention by
// finding the actor URI in to/cc, so cc'ing the human-readable profile url
// meant the mention was delivered but never counted as one. tag.href has always
// used the actor id; these two have to agree.
export function actorIdOf(userRemote: UserRemote): string {
  return userRemote.activityPubActorUrl || userRemote.profileUrl;
}

export function mentionTagsFor(mentions: UserRemote[]) {
  return mentions.map((userRemote) => ({
    type: 'Mention',
    href: actorIdOf(userRemote),
    name: `@${userRemote.username}`,
  }));
}

export async function createNote(
  host: string,
  localContent: Content,
  localUser: User,
  opt_follower?: UserRemote[],
  replyStats?: ReplyStats,
  mentions?: UserRemote[]
) {
  const activityObject = await createNoteObject(host, localContent, localUser, replyStats, mentions);
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
  // A content warning: `sensitive` blurs the media, `summary` is the text shown
  // in the post's place until a reader expands it.
  sensitive?: boolean;
  summary?: string;
  attachment?: { type: string; mediaType?: string; url: string; name?: string; width?: number; height?: number }[];
  tag?: { type: string; href: string; name: string }[];
  replies?: { id?: string; type?: string; totalItems?: number; updated?: string; first?: unknown };
  // Not AS2 — a leftover from the Atom mapping, where thr:count and thr:updated
  // are attributes on the replies link. Read on the way in for the feed path;
  // real ActivityPub peers send `replies` above.
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

// FEP-fe34: an actor may only speak for objects on its own origin.
//
// Verifying the signature proves who sent an activity, not what they are
// entitled to say with it. Nothing tied `activity.object.id` to `activity.actor`
// before this, so any actor we had ever stored — anyone who has ever followed us
// — could send a signed Delete naming somebody else's post id and have it
// removed from the reader, or a Create keyed to a URL on a domain they don't
// control.
//
// Compared by origin rather than by exact host so that a peer serving objects
// from the same site over the same scheme still matches.
export function isSameOrigin(objectId: string, actorUrl: string): boolean {
  try {
    return new URL(objectId).origin === new URL(actorUrl).origin;
  } catch {
    return false;
  }
}

// The origin an activity is entitled to write to. Prefer the actor id in the
// payload — that's what was signed — and fall back to what we have on file.
function authorityFor(activity: GenericMessage, userRemote: UserRemote): string {
  return activity.actor || userRemote.activityPubActorUrl || userRemote.profileUrl || '';
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
      await handleAnnounce(host, activity, user, userRemote);
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

  // Deleting somebody else's post is not a thing this actor may ask for, however
  // valid their signature. Without this a single follower could clear another
  // instance's content out of the reader by naming its ids.
  if (!isSameOrigin(objectId, authorityFor(activity, userRemote))) return;

  await removeRemoteContentByPostId(user.username, objectId);
}

// A boost. The object is usually a bare URI, so fetch the original to get
// something worth showing; if that fails there's nothing to store.
async function handleAnnounce(host: string, activity: GenericMessage, user: User, userRemote: UserRemote) {
  const objectId = objectIdOf(activity);
  if (!objectId) return;

  let announced = objectOf(activity) as Activity | null;
  if (!announced?.content) {
    try {
      announced = (await fetchActivityJson(objectId, { host, signer: user })) as unknown as Activity;
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

// The peer's Ed25519 Multikey, fetched from their actor document on demand.
//
// Anyone discovered before we started recording this has no key stored, and
// waiting for them to be re-discovered would leave proofs unverifiable for the
// entire existing follower list. Only worth reaching out when there's actually
// a proof to check — callers gate on that, so a peer without one never costs a
// fetch.
export async function ensureAssertionKey(userRemote: UserRemote): Promise<string> {
  if (userRemote.ed25519PublicKey) return userRemote.ed25519PublicKey;

  const actorUrl = userRemote.activityPubActorUrl || userRemote.profileUrl;
  if (!actorUrl) return '';

  try {
    const key = assertionKeyOf(await getActivityPubActor(actorUrl));
    if (!key) return '';
    await saveRemoteUser(Object.assign({}, userRemote, { ed25519PublicKey: key.publicKeyMultibase }));
    return key.publicKeyMultibase;
  } catch {
    // No actor document, no assertionMethod, or a key on a curve this
    // cryptosuite can't use — all of it means "can't verify a proof from them".
    return '';
  }
}

// Re-reads a peer's signing keys from their actor document.
//
// The key we verify against is whatever was on file the day we discovered them,
// and it was never refreshed. When a peer rotates — which instances do, on a
// schedule or after an incident — every subsequent delivery from them failed to
// verify, permanently, with no way back other than deleting the row by hand.
//
// Returns the updated peer, or null if nothing could be read. The caller is
// expected to have seen a signature fail first: this costs an outbound request,
// so it must not be reachable by simply POSTing junk at an inbox.
export async function refreshRemoteKey(userRemote: UserRemote): Promise<UserRemote | null> {
  const actorUrl = userRemote.activityPubActorUrl || userRemote.profileUrl;
  if (!actorUrl) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actorJSON = (await getActivityPubActor(actorUrl)) as any;
    const publicKeyPem = actorJSON?.publicKey?.publicKeyPem;
    if (!publicKeyPem) return null;

    // Nothing changed — the signature failed for some other reason, and
    // rewriting the row would only hide that.
    if (publicKeyPem === userRemote.magicKey) return null;

    const updated = Object.assign({}, userRemote, {
      magicKey: publicKeyPem,
      // Rotating one key is a good moment to pick up the other.
      ed25519PublicKey: assertionKeyOf(actorJSON)?.publicKeyMultibase || userRemote.ed25519PublicKey,
    });
    await saveRemoteUser(updated);
    return updated;
  } catch {
    return null;
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

// How many replies the peer says their post has. AS2 puts it in `replies`,
// which may be an inlined collection or a bare URL we won't chase; the flat
// repliesCount is the Atom shape, kept as a fallback for the feed path.
function replyCountOf(activityObject: Activity): number {
  const inlined = activityObject.replies?.totalItems;
  if (typeof inlined === 'number' && Number.isFinite(inlined)) return inlined;
  return parseInt(activityObject.repliesCount || '') || 0;
}

async function handleCreate(host: string, activity: GenericMessage, user: User, userRemote: UserRemote) {
  const activityObject = activity.object as Activity;
  if (!activityObject?.id) return;

  // FEP-fe34 again: the post has to live where its author does. Otherwise a
  // signed Create can plant a row keyed to a URL on a domain the sender has
  // nothing to do with — and since Update reuses this handler, overwrite one
  // that's already there.
  if (!isSameOrigin(activityObject.id, authorityFor(activity, userRemote))) return;

  const atomContent = sanitizeHTML(activityObject.content || '');

  const existingContentRemote = await getRemoteContent(user.username, activityObject.id.toString());

  const contentRemote = {
    id: existingContentRemote?.id || -1,
    avatar: userRemote.avatar,
    commentsCount: replyCountOf(activityObject),
    commentsUpdated: new Date(activityObject.replies?.updated || activityObject.repliesUpdated || new Date()),
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
    // Carry the peer's content warning through, so the reader can collapse the
    // post the way their own instance would have.
    sensitive: !!activityObject.sensitive || !!activityObject.summary,
    contentWarning: activityObject.summary || null,
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
