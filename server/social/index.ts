import type { Context } from '../context';
import type { Content, ContentRemote, UserRemote } from '../../generated/prisma/client';
import { discoverUserRemoteInfoSaveAndSubscribe } from './discover-user';
import { follow as activityStreamsFollow, like as activityStreamsLike } from './activitystreams';
import { parseFeedAndInsertIntoDb, retrieveFeed } from './feeds';

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
  if (!ctx.currentUser) return null;

  const userRemote = await discoverUserRemoteInfoSaveAndSubscribe(profileUrl, ctx.currentUsername);
  if (!userRemote) return null;

  const feedResponseText = await retrieveFeed(userRemote.feedUrl);
  await parseFeedAndInsertIntoDb(userRemote, feedResponseText);
  await activityStreamsFollow(ctx.hostname, ctx.currentUser, userRemote, true);

  return userRemote;
}

export async function unsubscribeFromFeed(ctx: Context, profileUrl: string): Promise<boolean> {
  if (!ctx.currentUser) return false;

  const userRemote = await ctx.prisma.userRemote.findUnique({
    where: { localUsername_profileUrl: { localUsername: ctx.currentUsername, profileUrl } },
  });
  if (!userRemote) return false;

  if (userRemote.follower) {
    await ctx.prisma.userRemote.update({ data: { following: false }, where: { id: userRemote.id } });
  } else {
    await ctx.prisma.userRemote.delete({ where: { id: userRemote.id } });
  }

  await activityStreamsFollow(ctx.hostname, ctx.currentUser, userRemote, false);
  return true;
}
