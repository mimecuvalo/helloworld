import type { ContentRemote, UserRemote } from '../../generated/prisma/client';
import { parseContentUrl } from '../../lib/url-factory';
import prisma from '../prisma';

const FEED_MAX_DAYS_OLD = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function getLocalUser(localUserUrl: string) {
  if (!localUserUrl) {
    return null;
  }

  const username = parseContentUrl(localUserUrl).username;
  return await prisma.user.findUnique({ where: { username } });
}

export async function getLocalContent(localContentUrl: string) {
  const { username, name } = parseContentUrl(localContentUrl);
  return await prisma.content.findUnique({ where: { username_name: { username, name } } });
}

export async function getLocalLatestContent(localContentUrl: string) {
  const { username } = parseContentUrl(localContentUrl);

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

export async function getRemoteCommentsOnLocalContent(localContentUrl: string) {
  const { username, name } = parseContentUrl(localContentUrl);
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
