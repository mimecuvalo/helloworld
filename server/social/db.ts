import type { ContentRemote, User, UserRemote } from '../../generated/prisma/client';
import { parseContentUrl } from '../../lib/url-factory';
import { encryptSecret } from '../secrets';
import { generateEd25519Key } from './integrity-proof';
import prisma from '../prisma';

const FEED_MAX_DAYS_OLD = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function getLocalUser(localUserUrl: string) {
  if (!localUserUrl) {
    return null;
  }

  const username = parseContentUrl(localUserUrl).username;
  return await prisma.user.findUnique({ where: { username } });
}

// The site's default user, for endpoints reached without a ?resource= — whoever
// owns this hostname, else the first account. Mirrors what the homepage resolves
// (fetchPublicUserData in server/services/user.ts).
export async function getDefaultLocalUser(hostname: string) {
  const byHostname = hostname ? await prisma.user.findFirst({ where: { hostname } }) : null;
  return byHostname || (await prisma.user.findUnique({ where: { id: 1 } }));
}

// The Ed25519 key that backs this user's object integrity proofs, minted on
// first use. Follows the same on-demand shape as ensureAtprotoSigningKey: users
// created before FEP-8b32 support shouldn't need a migration to federate, and
// the actor endpoint is where the key first has to be true in public.
//
// Mutates the passed row so the caller can publish the key it just created.
export async function ensureEd25519Key(user: User): Promise<string> {
  if (user.ed25519PrivateKey) return user.ed25519PrivateKey;

  const { privateKeyPem } = generateEd25519Key();
  const stored = encryptSecret(privateKeyPem);
  await prisma.user.update({ where: { id: user.id }, data: { ed25519PrivateKey: stored } });
  user.ed25519PrivateKey = stored;
  return stored;
}

export async function getLocalUserByUsername(username: string) {
  if (!username) return null;
  return await prisma.user.findUnique({ where: { username } });
}

// The ActivityPub routes address content by (username, name) straight out of
// the path, rather than by round-tripping a permalink through parseContentUrl.
export async function getLocalContentByName(username: string, name: string) {
  if (!username || !name) return null;
  return await prisma.content.findUnique({ where: { username_name: { username, name } } });
}

export async function getLocalContent(localContentUrl: string) {
  const { username, name } = parseContentUrl(localContentUrl);
  return await prisma.content.findUnique({ where: { username_name: { username, name } } });
}

export async function getLocalLatestContent(localContentUrl: string) {
  return await getLocalLatestContentByUsername(parseContentUrl(localContentUrl).username);
}

export async function getLocalLatestContentByUsername(username: string) {
  const contentConstraints = {
    username,
    section: { not: 'main' },
    album: { not: 'main' },
    hidden: false,
    redirect: 0,
  };
  return await prisma.content.findMany({
    where: contentConstraints,
    orderBy: [{ createdAt: 'desc' }],
    take: 50,
  });
}

// NodeInfo usage stats. Counts only what's publicly visible, matching what the
// feeds and the outbox expose.
export async function countLocalUsersAndContent(): Promise<[number, number]> {
  return await Promise.all([
    prisma.user.count(),
    prisma.content.count({ where: { hidden: false, section: { not: 'main' } } }),
  ]);
}

// Local users with a Bluesky account linked, for the cron's sync pass.
export async function getLocalUsersWithBluesky() {
  return await prisma.user.findMany({ where: { atprotoHandle: { not: null } } });
}

export async function getRemoteUser(localUsername: string, profileUrl: string) {
  return await prisma.userRemote.findUnique({
    where: { localUsername_profileUrl: { localUsername, profileUrl } },
  });
}

export async function getRemoteUserByActor(localUsername: string, activityPubActorUrl: string) {
  return await prisma.userRemote.findUnique({
    where: { localUsername_activityPubActorUrl: { localUsername, activityPubActorUrl } },
  });
}

export async function saveRemoteUser(remoteUser: UserRemote) {
  // Upsert on the natural key so a freshly-discovered user (id -1/unset) doesn't
  // collide with other new users on a forced id. Strip id/timestamps so create
  // autoincrements. (The legacy id-based upsert clobbered rows.)
  const { id: _id, createdAt: _c, updatedAt: _u, ...data } = remoteUser;
  return await prisma.userRemote.upsert({
    where: { localUsername_profileUrl: { localUsername: remoteUser.localUsername, profileUrl: remoteUser.profileUrl } },
    update: data,
    create: data,
  });
}

export async function removeRemoteUser(remoteUser: UserRemote) {
  return await prisma.userRemote.delete({ where: { id: remoteUser.id } });
}

export async function getRemoteAllUsers() {
  return await prisma.userRemote.findMany({ where: { following: true } });
}

export async function getRemoteFriends(usernameOrUrl: string) {
  const localUsername = parseContentUrl(usernameOrUrl).username;
  const followers = await prisma.userRemote.findMany({ where: { localUsername, follower: true } });
  const following = await prisma.userRemote.findMany({ where: { localUsername, following: true } });
  return [followers, following];
}

// The blogroll: everyone this user follows, in the order the reader shows them.
export async function getRemoteFollowing(usernameOrUrl: string) {
  const localUsername = parseContentUrl(usernameOrUrl).username;
  return await prisma.userRemote.findMany({
    where: { localUsername, following: true },
    orderBy: [{ order: 'asc' }, { username: 'asc' }],
  });
}

export async function getRemoteContent(localUsername: string, link: string) {
  return await prisma.contentRemote.findFirst({ where: { toUsername: localUsername, link } });
}

export async function saveRemoteContent(remoteContent: ContentRemote | ContentRemote[]) {
  if (remoteContent instanceof Array) {
    return await prisma.contentRemote.createMany({ data: remoteContent, skipDuplicates: true });
  }
  // A new item carries a sentinel id (<= 0); create it so the id autoincrements
  // (a forced id would clobber other new rows). An existing item updates by id.
  const { id, ...data } = remoteContent;
  if (id && id > 0) {
    return await prisma.contentRemote.upsert({ where: { id }, update: data, create: data });
  }
  return await prisma.contentRemote.create({ data });
}

export async function removeOldRemoteContent() {
  return await prisma.contentRemote.deleteMany({
    where: {
      type: 'post',
      favorited: false,
      localContentName: null,
      createdAt: { lt: new Date(Date.now() - FEED_MAX_DAYS_OLD).toISOString() },
    },
  });
}

// A Delete activity names the object id but not which flavour of row it became
// (post / comment / favorite), so this deletes by id alone.
export async function removeRemoteContentByPostId(toUsername: string, postId: string) {
  return await prisma.contentRemote.deleteMany({ where: { toUsername, postId } });
}

export async function removeRemoteContent(remoteContent: ContentRemote) {
  return await prisma.contentRemote.deleteMany({
    where: { toUsername: remoteContent.toUsername, postId: remoteContent.postId, type: remoteContent.type },
  });
}

export type ReplyStats = { count: number; updated: Date | null };

// How many replies each of these local items has, and when the newest arrived —
// the thr:count / thr:updated pair in Atom, totalItems in an ActivityPub replies
// collection.
//
// Batched on purpose: a feed or an outbox page renders 50 items, and asking
// per-item is 50 round trips to answer one question. (Content.commentsCount
// exists on the row but nothing has ever written to it, so counting is also the
// only way to get a number that isn't zero.)
export async function getReplyStatsForLocalContents(
  username: string,
  names: string[]
): Promise<Record<string, ReplyStats>> {
  if (!names.length) return {};

  const rows = await prisma.contentRemote.groupBy({
    by: ['localContentName'],
    where: {
      toUsername: username,
      localContentName: { in: names },
      type: 'comment',
      deleted: false,
      isSpam: false,
    },
    _count: { _all: true },
    _max: { createdAt: true },
  });

  const stats: Record<string, ReplyStats> = {};
  for (const row of rows) {
    if (row.localContentName) stats[row.localContentName] = { count: row._count._all, updated: row._max.createdAt };
  }
  return stats;
}

export async function getReplyStatsForLocalContent(localContentUrl: string): Promise<ReplyStats> {
  const { username, name } = parseContentUrl(localContentUrl);
  const stats = await getReplyStatsForLocalContents(username, [name]);
  return stats[name] || { count: 0, updated: null };
}

export async function getReplyStatsForLocalContentName(username: string, name: string): Promise<ReplyStats> {
  const stats = await getReplyStatsForLocalContents(username, [name]);
  return stats[name] || { count: 0, updated: null };
}

export async function getRemoteCommentsOnLocalContent(localContentUrl: string) {
  const { username, name } = parseContentUrl(localContentUrl);
  return await getRemoteCommentsOnLocalContentByName(username, name);
}

export async function getRemoteCommentsOnLocalContentByName(username: string, name: string) {
  return await prisma.contentRemote.findMany({
    where: {
      toUsername: username,
      localContentName: name,
      deleted: false,
      isSpam: false,
      type: 'comment',
    },
    orderBy: [{ createdAt: 'desc' }],
  });
}
