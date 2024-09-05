import { ContentRemote, UserRemote } from '@prisma/client';

import { parseContentUrl } from 'util/url-factory';
import prisma from 'data/prisma';

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

export async function getRemoteUser(localUsername: string, profileUrl: string) {
  return await prisma.userRemote.findUnique({
    where: {
      localUsername_profileUrl: {
        localUsername,
        profileUrl,
      },
    },
  });
}

export async function getRemoteUserByActor(localUsername: string, activityPubActorUrl: string) {
  return await prisma.userRemote.findUnique({
    where: {
      localUsername_activityPubActorUrl: {
        localUsername,
        activityPubActorUrl,
      },
    },
  });
}

export async function saveRemoteUser(remoteUser: UserRemote) {
  return await prisma.userRemote.upsert({ where: { id: remoteUser.id }, update: remoteUser, create: remoteUser });
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
  return await prisma.contentRemote.findFirst({
    where: {
      toUsername: localUsername,
      link,
    },
  });
}

export async function saveRemoteContent(remoteContent: ContentRemote | ContentRemote[]) {
  if (remoteContent instanceof Array) {
    return await prisma.contentRemote.createMany({ data: remoteContent, skipDuplicates: true });
  } else {
    return await prisma.contentRemote.upsert({
      where: { id: remoteContent.id },
      update: remoteContent,
      create: remoteContent,
    });
  }
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

export async function removeRemoteContent(remoteContent: ContentRemote) {
  return await prisma.contentRemote.delete({
    where: remoteContent,
  });
}

export async function getRemoteCommentsOnLocalContent(localContentUrl: string) {
  const { username, name } = parseContentUrl(localContentUrl);
  const result = await prisma.contentRemote.findMany({
    where: {
      toUsername: username,
      localContentName: name,
      deleted: false,
      isSpam: false,
      type: 'comment',
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return result;
}
