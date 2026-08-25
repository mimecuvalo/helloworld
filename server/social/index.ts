import type { Context } from '../context';
import type { Content, ContentRemote, User, UserRemote } from '../../generated/prisma/client';
import { discoverUserRemoteInfoSaveAndSubscribe } from './discover-user';
import { follow as activityStreamsFollow, like as activityStreamsLike } from './activitystreams';
import { parseFeedAndInsertIntoDb, retrieveFeed } from './feeds';
import { syndicateContent, syndicateDelete } from './syndicate';
import {
  followOnBluesky,
  isAtprotoUserRemote,
  likeOnBluesky,
  pollAtprotoUser,
  replyOnBluesky,
  repostOnBluesky,
  syncFollowersFromBluesky,
  syncProfileToBluesky,
  unfollowOnBluesky,
} from './atproto';

// Push a post out to its owner's followers (and anyone it mentions). `isUpdate`
// picks between Create — a new post — and Update, which replaces one peers
// already hold.
//
// The owner is passed in rather than taken from ctx: a comment is written by
// one user onto another user's post, and it's the post owner's followers and
// signing key that the delivery belongs to.
export async function syndicate(
  ctx: Context,
  contentOwner: User,
  content: Content,
  options: { isUpdate?: boolean } = {}
): Promise<void> {
  await syndicateContent(ctx.hostname, contentOwner, content, options);
}

export async function unsyndicate(ctx: Context, contentOwner: User, content: Content): Promise<void> {
  await syndicateDelete(ctx.hostname, contentOwner, content);
}

export async function like(
  ctx: Context,
  contentRemote: ContentRemote,
  userRemote: UserRemote,
  favorited: boolean
): Promise<void> {
  if (!ctx.currentUser) return;

  // An atproto peer has no inbox to deliver a Like activity to; the like has to
  // be a real app.bsky.feed.like on the post itself.
  if (isAtprotoUserRemote(userRemote)) {
    await likeOnBluesky(ctx.currentUser, contentRemote.postId, favorited);
    return;
  }

  await activityStreamsLike(ctx.hostname, ctx.currentUser, contentRemote, userRemote, favorited);
}

// Reblogging a Bluesky post reposts it there; elsewhere reblogs stay local.
export async function reblog(
  ctx: Context,
  contentRemote: ContentRemote,
  userRemote: UserRemote,
  isRepost: boolean
): Promise<void> {
  if (!ctx.currentUser || !isAtprotoUserRemote(userRemote)) return;
  await repostOnBluesky(ctx.currentUser, contentRemote.postId, isRepost);
}

// Commenting on a remote item: replies to a Bluesky post go back as replies.
export async function replyToRemote(ctx: Context, contentRemote: ContentRemote, text: string): Promise<void> {
  if (!ctx.currentUser || !contentRemote.postId?.startsWith('at://')) return;
  await replyOnBluesky(ctx.currentUser, contentRemote.postId, text);
}

export async function syncBlueskyProfile(ctx: Context): Promise<void> {
  if (!ctx.currentUser) return;
  await syncProfileToBluesky(ctx.hostname, ctx.currentUser);
}

export async function syncBlueskyFollowers(ctx: Context): Promise<number> {
  if (!ctx.currentUser) return 0;
  return await syncFollowersFromBluesky(ctx.currentUser);
}

export async function subscribeToFeed(ctx: Context, profileUrl: string): Promise<UserRemote | null> {
  if (!ctx.currentUser) return null;

  const userRemote = await discoverUserRemoteInfoSaveAndSubscribe(profileUrl, ctx.currentUsername);
  if (!userRemote) return null;

  // An AT Protocol peer has no Atom feed and no inbox: seed the reader from
  // their author feed, and mirror the follow onto Bluesky if we can.
  if (isAtprotoUserRemote(userRemote)) {
    await pollAtprotoUser(userRemote);
    await followOnBluesky(ctx.currentUser, userRemote);
    return userRemote;
  }

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

  if (isAtprotoUserRemote(userRemote)) {
    await unfollowOnBluesky(ctx.currentUser, userRemote);
    return true;
  }

  await activityStreamsFollow(ctx.hostname, ctx.currentUser, userRemote, false);
  return true;
}
