import type { Content, User, UserRemote } from '../../generated/prisma/client';
import * as cheerio from 'cheerio';
import { nanoid } from 'nanoid';
import { buildUrl, contentUrl, profileUrl } from '../../lib/url-factory';
import {
  ACTIVITY_JSON,
  createGenericMessage,
  createNoteObject,
  deliver,
  followersUrlFor,
  PUBLIC_AUDIENCE,
} from './activitystreams';
import { getActivityPubActor, getUserRemoteInfo } from './discover-user';
import { getRemoteContent, getRemoteFriends, getRemoteUser, getReplyStatsForLocalContent, saveRemoteUser } from './db';
import { fetchJSON } from '../crawler';
import { deleteFromBluesky, publishToBluesky } from './atproto';

// Delivery of a local post to the fediverse.
//
// Three audiences: everyone who follows this user (ActivityPub inbox, or Salmon
// for the OStatus holdouts), anyone the post mentions by @handle even if they
// don't follow, and — when the post is a reply — whoever wrote the post it
// answers. Unknown actors in either of the last two are discovered on the fly.
//
// That third one is easy to lose: the Reply button writes an `a.u-in-reply-to`
// anchor, which sets content.thread but is not one of the selectors
// findMentions looks at. Replies therefore reached our own followers and never
// the person being replied to, who saw nothing at all unless they already
// followed us.

const MENTION_REGEXP = /@([a-z0-9_.-]+)@([a-z0-9.-]+\.[a-z]{2,})/gi;

// Mentions come from two places: microformats anchors the editor writes, and
// bare @user@host text. The anchors are authoritative when present.
export function findMentions(html: string): string[] {
  const mentions = new Set<string>();

  try {
    const $ = cheerio.load(html);
    $('a.u-mention, a.h-card, a.mention').each((_index, element) => {
      const href = $(element).attr('href');
      if (href) mentions.add(href);
    });
    // Only scan text nodes for bare handles — an @ inside an href or an image
    // alt is not a mention.
    for (const match of ($.root().text() || '').matchAll(MENTION_REGEXP)) {
      mentions.add(`https://${match[2]}/${match[1]}`);
    }
  } catch {
    /* malformed html — whatever we found so far still stands */
  }

  return [...mentions];
}

async function resolveMentions(localUsername: string, urls: string[]): Promise<UserRemote[]> {
  const resolved = await Promise.all(
    urls.map(async (url) => {
      try {
        const existing = await getRemoteUser(localUsername, url);
        if (existing) return existing;

        const discovered = await getUserRemoteInfo(url, localUsername);
        if (!discovered?.profileUrl) return null;
        await saveRemoteUser(discovered);
        return await getRemoteUser(localUsername, discovered.profileUrl);
      } catch {
        // A mention we can't resolve just doesn't get delivered to.
        return null;
      }
    })
  );

  // Two urls can name the same person — the thread author who is also mentioned
  // in the body, a profile page alongside its actor id — and they must not be
  // tagged or cc'd twice.
  const seen = new Set<string>();
  return resolved.filter((userRemote): userRemote is UserRemote => {
    if (!userRemote || seen.has(userRemote.profileUrl)) return false;
    seen.add(userRemote.profileUrl);
    return true;
  });
}

// `attributedTo` is a string, an object with an id, or an array of either.
function attributedToOf(object: unknown): string {
  const attributedTo = (object as { attributedTo?: unknown })?.attributedTo;
  const first = Array.isArray(attributedTo) ? attributedTo[0] : attributedTo;
  if (typeof first === 'string') return first;
  return (first as { id?: string } | undefined)?.id || '';
}

// Who wrote the post this one replies to.
//
// Resolved once at save time and kept on the row as content.threadUser, rather
// than worked out again on every delivery and every feed render. The column has
// been in the schema all along and the Atom rendering already reads it for
// ostatus:attention — nothing ever wrote it.
export async function resolveThreadUser(localUsername: string, threadUrl: string): Promise<string | null> {
  if (!threadUrl) return null;

  // The ordinary case costs nothing: you replied to something sitting in your
  // reader, so we already stored who wrote it.
  const stored = await getRemoteContent(localUsername, threadUrl);
  if (stored?.fromUsername) return stored.fromUsername;

  // Otherwise ask the post itself. Two hops, once, at save time.
  try {
    const parent = await fetchJSON(threadUrl, { Accept: ACTIVITY_JSON });
    const attributedTo = attributedToOf(parent);
    if (!attributedTo) return null;

    // Prefer the profile page the actor advertises: that's the shape the rest
    // of this file addresses people by, and what UserRemote is keyed on.
    const actor = (await getActivityPubActor(attributedTo)) as unknown as { url?: string };
    return actor?.url || attributedTo;
  } catch {
    // A reply to something we can't fetch still posts; it just doesn't get
    // delivered straight to the author.
    return null;
  }
}

// Two followers on the same Mastodon instance share a sharedInbox; posting once
// per follower would send the same activity to that instance N times.
function dedupeByInbox(recipients: UserRemote[]): UserRemote[] {
  const seen = new Set<string>();
  return recipients.filter((userRemote) => {
    const key = userRemote.sharedInboxUrl || userRemote.activityPubInboxUrl || userRemote.salmonUrl;
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function syndicateContent(
  host: string,
  contentOwner: User,
  content: Content,
  { isUpdate = false }: { isUpdate?: boolean } = {}
): Promise<void> {
  // Nothing non-public may leave the building.
  if (content.hidden) return;

  // The Bluesky mirror is independent of who follows over ActivityPub, so it
  // runs even when there is no fediverse audience at all.
  await publishToBluesky(host, contentOwner, content);

  const [followers] = await getRemoteFriends(profileUrl(contentOwner.username, host));
  // The thread author goes first so that if they're also mentioned in the body,
  // it's this entry that survives the dedupe — same person either way, but the
  // reply is addressed to them because it answers them.
  const mentioned = await resolveMentions(contentOwner.username, [
    ...(content.threadUser ? [content.threadUser] : []),
    ...findMentions(content.view),
  ]);
  const recipients = dedupeByInbox([...followers, ...mentioned]);
  if (!recipients.length) return;

  // A Create is always a fresh post with no replies, but an Update replaces a
  // post peers already hold — and by then it may well have a thread under it.
  const replyStats = isUpdate ? await getReplyStatsForLocalContent(contentUrl(content, undefined, host)) : undefined;
  const object = await createNoteObject(host, content, contentOwner, replyStats);
  // Addressed by actor id, not profile page: Mastodon matches a mention by
  // finding the actor URI in to/cc, so cc'ing the human-readable profile url
  // meant the mention was delivered but never registered as one. tag.href has
  // always used the actor id; these two have to agree.
  const actorIdOf = (userRemote: UserRemote) => userRemote.activityPubActorUrl || userRemote.profileUrl;
  object.cc = [followersUrlFor(host, contentOwner), ...mentioned.map(actorIdOf)];
  object.tag = mentioned.map((userRemote) => ({
    type: 'Mention',
    href: actorIdOf(userRemote),
    name: `@${userRemote.username}`,
  }));

  // Create announces a new post; Update replaces one the peer already has.
  const activityUrl = buildUrl({
    host,
    pathname: `/api/social/activitypub/${isUpdate ? 'update' : 'create'}`,
    searchParams: { id: nanoid(10), resource: contentUrl(content, undefined, host) },
  });
  const message = createGenericMessage(
    isUpdate ? 'Update' : 'Create',
    host,
    activityUrl,
    contentOwner,
    object,
    recipients
  );
  message.to = [PUBLIC_AUDIENCE];

  await deliver(host, contentOwner, recipients, message);
}

export async function syndicateDelete(host: string, contentOwner: User, content: Content): Promise<void> {
  await deleteFromBluesky(contentOwner, content);

  const [followers] = await getRemoteFriends(profileUrl(contentOwner.username, host));
  const recipients = dedupeByInbox(followers);
  if (!recipients.length) return;

  const objectUrl = buildUrl({
    host,
    pathname: '/api/social/activitypub/message',
    searchParams: { resource: contentUrl(content, undefined, host) },
  });
  const message = createGenericMessage(
    'Delete',
    host,
    buildUrl({
      host,
      pathname: '/api/social/activitypub/delete',
      searchParams: { id: nanoid(10), resource: objectUrl },
    }),
    contentOwner,
    { id: objectUrl, url: objectUrl, type: 'Tombstone' },
    recipients
  );
  message.to = [PUBLIC_AUDIENCE];

  await deliver(host, contentOwner, recipients, message);
}
