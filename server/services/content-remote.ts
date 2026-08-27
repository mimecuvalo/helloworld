import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import type { Context } from '../context';
import type { Prisma } from '../../generated/prisma/client';
import { syndicate } from '../social';
import { like, reblog } from '../social';

export function allContentRemote(ctx: Context) {
  return ctx.prisma.contentRemote.findMany();
}

export function fetchContentRemote(ctx: Context, id: number) {
  return ctx.prisma.contentRemote.findUnique({ where: { id } });
}

export const FEED_PAGE_SIZE = 20;

export async function fetchContentRemotePaginated(
  ctx: Context,
  args: {
    profileUrlOrSpecialFeed: string;
    cursorCreatedAt?: string;
    cursorId?: number;
    shouldShowAllItems?: boolean;
  }
) {
  const { currentUsername, prisma } = ctx;
  const { profileUrlOrSpecialFeed, cursorCreatedAt, cursorId, shouldShowAllItems } = args;

  const constraints: Prisma.ContentRemoteWhereInput = {
    toUsername: currentUsername,
    deleted: false,
    isSpam: false,
  };
  let order: Prisma.SortOrder = 'desc';

  switch (profileUrlOrSpecialFeed) {
    case 'favorites':
      constraints.favorited = true;
      break;
    case 'comments':
      constraints.type = 'comment';
      break;
    default:
      if (profileUrlOrSpecialFeed) {
        constraints.fromUsername = profileUrlOrSpecialFeed;
        const userRemote = await prisma.userRemote.findUnique({
          select: { sortType: true },
          where: {
            localUsername_profileUrl: { localUsername: currentUsername, profileUrl: profileUrlOrSpecialFeed },
          },
        });
        if (userRemote?.sortType === 'oldest') order = 'asc';
      }
      constraints.type = 'post';
      if (!shouldShowAllItems) constraints.read = false;
      break;
  }

  // Keyset seek: strictly past the cursor in the sort direction, id breaking ties.
  //
  // Offset pagination is undefined here because the unread feed shrinks behind
  // you as items are marked read while you scroll — skip/take then either
  // repeats or skips rows depending on which requests land first. A keyset
  // cursor is a sort position rather than a row index, so rows leaving the set
  // behind it shift nothing.
  //
  // Prisma's own `cursor:` option can't be used: it looks the cursor row up and
  // requires it to still satisfy `where`, but that row is precisely the one we
  // just marked read, so it's been filtered out.
  const op = order === 'desc' ? 'lt' : 'gt';
  const seek =
    cursorCreatedAt && cursorId !== undefined
      ? {
          OR: [
            { createdAt: { [op]: new Date(cursorCreatedAt) } },
            { createdAt: new Date(cursorCreatedAt), id: { [op]: cursorId } },
          ],
        }
      : undefined;

  return prisma.contentRemote.findMany({
    where: seek ? { AND: [constraints, seek] } : constraints,
    orderBy: [{ createdAt: order }, { id: order }],
    take: FEED_PAGE_SIZE,
  });
}

export async function fetchUserTotalCounts(ctx: Context) {
  const { currentUsername, prisma } = ctx;
  const common: { [key: string]: string | boolean } = { toUsername: currentUsername, deleted: false, isSpam: false };

  const commentsCount = await prisma.contentRemote.count({ where: Object.assign({}, common, { type: 'comment' }) });
  const favoritesCount = await prisma.contentRemote.count({ where: Object.assign({}, common, { favorited: true }) });
  const totalCount = await prisma.contentRemote.count({
    where: Object.assign({}, common, { type: 'post', read: false }),
  });

  return { commentsCount, favoritesCount, totalCount };
}

export async function fetchFeedCounts(ctx: Context) {
  const result = await ctx.prisma.contentRemote.groupBy({
    by: ['fromUsername'],
    _count: true,
    where: { toUsername: ctx.currentUsername, deleted: false, isSpam: false, read: false, type: 'post' },
  });
  return result.map((c) => ({ count: c._count, ...c }));
}

export function fetchCommentsRemote(ctx: Context, args: { username?: string | null; name?: string | null }) {
  return ctx.prisma.contentRemote.findMany({
    select: {
      avatar: true,
      creator: true,
      createdAt: true,
      deleted: true,
      favorited: true,
      fromUsername: true,
      link: true,
      localContentName: true,
      postId: true,
      type: true,
      username: true,
      view: true,
    },
    where: {
      toUsername: args.username || '',
      localContentName: args.name,
      deleted: false,
      isSpam: false,
      type: 'comment',
    },
    orderBy: [{ createdAt: 'desc' }],
  });
}

export function fetchFavoritesRemote(ctx: Context, args: { username?: string | null; name?: string | null }) {
  return ctx.prisma.contentRemote.findMany({
    select: {
      avatar: true,
      createdAt: true,
      fromUsername: true,
      localContentName: true,
      postId: true,
      type: true,
      username: true,
    },
    where: {
      toUsername: args.username || '',
      localContentName: args.name,
      deleted: false,
      isSpam: false,
      type: 'favorite',
    },
    orderBy: [{ createdAt: 'desc' }],
  });
}

export async function postComment(ctx: Context, args: { username: string; name: string; content: string }) {
  const { currentUserEmail, currentUserPicture, hostname, prisma } = ctx;
  const { username, name, content } = args;

  const localUrl = `/${username}/remote-comments/comment-${uuidv4()}`;
  const tagDate = new Date().toISOString().slice(0, 10);
  const postId = `tag:${hostname},${tagDate}:${localUrl}`;
  const link = `https://${hostname}${localUrl}`;

  const commentUsername = currentUserEmail.split('@')[0];
  const emailHash = crypto.createHash('md5').update(`mailto:${currentUserEmail}`).digest('hex');
  const gravatar = `http://www.gravatar.com/avatar/${emailHash}`;
  const avatar = currentUserPicture || gravatar;

  await prisma.contentRemote.create({
    data: {
      avatar,
      commentUser: currentUserEmail,
      fromUsername: null,
      link,
      localContentName: name,
      postId,
      title: '',
      toUsername: username,
      type: 'comment',
      username: commentUsername,
      view: content,
    },
  });

  const commentedContent = await prisma.content.findUnique({
    select: { id: true, hidden: true, commentsCount: true },
    where: { username_name: { username, name } },
  });
  const updatedCommentedContent = await prisma.content.update({
    data: { commentsCount: (commentedContent?.commentsCount || 0) + 1, commentsUpdated: new Date() },
    where: { id: commentedContent?.id },
  });
  const contentOwner = await prisma.user.findUnique({ where: { username } });

  if (!commentedContent?.hidden && contentOwner && updatedCommentedContent) {
    // A new comment changes the parent's comment count, so peers get an Update
    // of the parent post — signed by its owner, who may not be the commenter.
    await syndicate(ctx, contentOwner, updatedCommentedContent, { isUpdate: true });
  }

  return {
    avatar,
    content,
    deleted: false,
    favorited: false,
    fromUsername: null,
    link,
    localContentName: name,
    postId,
    toUsername: username,
    type: 'comment',
    username: commentUsername,
  };
}

export async function favoriteContentRemote(
  ctx: Context,
  args: { fromUsername: string; postId: string; type: string; favorited: boolean }
) {
  const { currentUsername, currentUserEmail, prisma } = ctx;
  const { fromUsername, postId, type, favorited } = args;

  if (type === 'comment') {
    await prisma.contentRemote.update({
      data: { favorited },
      where: { commentUser_postId: { commentUser: currentUserEmail, postId } },
    });
  } else {
    const contentRemote = await prisma.contentRemote.update({
      data: { favorited },
      where: { toUsername_fromUsername_postId: { toUsername: currentUsername, fromUsername, postId } },
    });
    const userRemote = await prisma.userRemote.findUnique({
      where: {
        localUsername_profileUrl: { localUsername: currentUsername, profileUrl: contentRemote.fromUsername || '' },
      },
    });
    if (userRemote) {
      await like(ctx, contentRemote, userRemote, favorited);
    }
  }

  return { fromUsername, postId, type, favorited };
}

// Natively repost a Bluesky item, rather than only quoting it into the editor.
export async function repostContentRemote(
  ctx: Context,
  args: { fromUsername: string; postId: string; isRepost: boolean }
) {
  const { currentUsername, prisma } = ctx;
  const { fromUsername, postId, isRepost } = args;

  const contentRemote = await prisma.contentRemote.findUnique({
    where: { toUsername_fromUsername_postId: { toUsername: currentUsername, fromUsername, postId } },
  });
  if (!contentRemote) return { reposted: false };

  const userRemote = await prisma.userRemote.findUnique({
    where: {
      localUsername_profileUrl: { localUsername: currentUsername, profileUrl: contentRemote.fromUsername || '' },
    },
  });
  if (!userRemote) return { reposted: false };

  await reblog(ctx, contentRemote, userRemote, isRepost);
  return { reposted: isRepost };
}

export async function deleteContentRemote(
  ctx: Context,
  args: { fromUsername: string; postId: string; localContentName: string; type: string; deleted: boolean }
) {
  const { currentUsername, currentUserEmail, prisma } = ctx;
  const { fromUsername, postId, localContentName, type, deleted } = args;

  if (type === 'comment') {
    await prisma.contentRemote.update({
      data: { deleted },
      where: { commentUser_postId: { commentUser: currentUserEmail, postId } },
    });
  } else {
    await prisma.contentRemote.update({
      data: { deleted },
      where: { toUsername_fromUsername_postId: { toUsername: currentUsername, fromUsername, postId } },
    });
  }

  const localContentWhere = { username_name: { username: currentUsername, name: localContentName } };
  const commentedContent = await prisma.content.findUnique({
    select: { commentsCount: true },
    where: localContentWhere,
  });
  await prisma.content.update({
    data: { commentsCount: (commentedContent?.commentsCount || 0) + (deleted ? -1 : 1) },
    where: localContentWhere,
  });

  return { fromUsername, postId, localContentName, type, deleted };
}

export async function markAllContentInFeedAsRead(ctx: Context, args: { fromUsername: string }) {
  await ctx.prisma.contentRemote.updateMany({
    data: { read: true },
    where: { toUsername: ctx.currentUsername, fromUsername: args.fromUsername },
  });
  return { fromUsername: args.fromUsername, count: 0 };
}

export async function markAllFeedsAsRead(ctx: Context) {
  await ctx.prisma.contentRemote.updateMany({ data: { read: true }, where: { toUsername: ctx.currentUsername } });
  return { count: 0 };
}

// Reaching the bottom of the feed marks every remaining item read at once, so
// reads arrive as a burst rather than one at a time. One updateMany keeps that
// to a single connection instead of one per item.
export const READ_BATCH_MAX = 200;

export async function readContentRemoteBatch(
  ctx: Context,
  args: { read: boolean; items: { fromUsername: string; postId: string }[] }
) {
  const { read, items } = args;
  if (!items.length) return { count: 0, read };

  // Match on the (toUsername, fromUsername, postId) unique key rather than
  // postId alone — two feeds can in principle publish the same guid.
  const { count } = await ctx.prisma.contentRemote.updateMany({
    data: { read },
    where: {
      toUsername: ctx.currentUsername,
      OR: items.map(({ fromUsername, postId }) => ({ fromUsername, postId })),
    },
  });
  return { count, read };
}
