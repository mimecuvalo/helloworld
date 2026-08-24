import type { Content, User, UserRemote } from '../../generated/prisma/client';
import * as cheerio from 'cheerio';
import { nanoid } from 'nanoid';
import { buildUrl, contentUrl } from '../../lib/url-factory';
import { createGenericMessage, createNoteObject, deliver, followersUrlFor, PUBLIC_AUDIENCE } from './activitystreams';
import { getUserRemoteInfo } from './discover-user';
import { getRemoteFriends, getRemoteUser, saveRemoteUser } from './db';
import { deleteFromBluesky, publishToBluesky } from './atproto';

// Delivery of a local post to the fediverse.
//
// Two audiences: everyone who follows this user (ActivityPub inbox, or Salmon
// for the OStatus holdouts), plus anyone the post mentions by @handle even if
// they don't follow. Mentioned-but-unknown actors are discovered on the fly.

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
  return resolved.filter((userRemote): userRemote is UserRemote => !!userRemote);
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

  const [followers] = await getRemoteFriends(contentOwner.username);
  const mentioned = await resolveMentions(contentOwner.username, findMentions(content.view));
  const recipients = dedupeByInbox([...followers, ...mentioned]);
  if (!recipients.length) return;

  const object = await createNoteObject(host, content, contentOwner);
  object.cc = [followersUrlFor(host, contentOwner), ...mentioned.map((userRemote) => userRemote.profileUrl)];
  object.tag = mentioned.map((userRemote) => ({
    type: 'Mention',
    href: userRemote.activityPubActorUrl || userRemote.profileUrl,
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

  const [followers] = await getRemoteFriends(contentOwner.username);
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
