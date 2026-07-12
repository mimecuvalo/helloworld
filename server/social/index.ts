import type { Context } from '../context';
import type { Content, ContentRemote, UserRemote } from '../../generated/prisma/client';
import { discoverUserRemoteInfoSaveAndSubscribe } from './discover-user';
import { like as activityStreamsLike } from './activitystreams';

export async function syndicate(
  _ctx: Context,
  _content: Content,
  _remoteContent?: ContentRemote,
  _isComment?: boolean
): Promise<void> {
  // TODO: syndicate to followers (needs mention parsing, TODO since the Next app).
}

export async function like(
  ctx: Context,
  contentRemote: ContentRemote,
  userRemote: UserRemote,
  favorited: boolean
): Promise<void> {
  if (!ctx.currentUser) return;
  await activityStreamsLike(ctx.hostname, ctx.currentUser, contentRemote, userRemote, favorited);
}

export async function subscribeToFeed(ctx: Context, profileUrl: string): Promise<UserRemote | null> {
  return discoverUserRemoteInfoSaveAndSubscribe(profileUrl, ctx.currentUsername);
}

export async function unsubscribeFromFeed(ctx: Context, profileUrl: string): Promise<boolean> {
  await ctx.prisma.userRemote.updateMany({
    where: { localUsername: ctx.currentUsername, profileUrl },
    data: { following: false },
  });
  return true;
}
