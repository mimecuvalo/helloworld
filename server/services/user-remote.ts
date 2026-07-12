import type { Context } from '../context';
import * as social from '../social';

export function createUserRemote(ctx: Context, input: { profileUrl: string }) {
  return social.subscribeToFeed(ctx, input.profileUrl);
}

export function destroyFeed(ctx: Context, input: { profileUrl: string }) {
  return social.unsubscribeFromFeed(ctx, input.profileUrl);
}

export function allUsersRemote(ctx: Context) {
  return ctx.prisma.userRemote.findMany();
}

export function fetchUserRemote(ctx: Context, id: number) {
  return ctx.prisma.userRemote.findUnique({ where: { id } });
}

export function fetchFollowers(ctx: Context) {
  return ctx.prisma.userRemote.findMany({
    select: {
      username: true,
      name: true,
      profileUrl: true,
      avatar: true,
      favicon: true,
      sortType: true,
      following: true,
    },
    where: { localUsername: ctx.currentUsername, follower: true },
    orderBy: { username: 'asc' },
  });
}

export function fetchFollowing(ctx: Context) {
  return ctx.prisma.userRemote.findMany({
    select: { username: true, name: true, profileUrl: true, avatar: true, favicon: true, sortType: true },
    where: { localUsername: ctx.currentUsername, following: true },
    orderBy: [{ order: 'asc' }, { username: 'asc' }],
  });
}

export async function toggleSortFeed(ctx: Context, input: { profileUrl: string; currentSortType: string }) {
  const sortType = input.currentSortType === 'oldest' ? '' : 'oldest';
  await ctx.prisma.userRemote.update({
    data: { sortType },
    where: {
      localUsername_profileUrl: { localUsername: ctx.currentUsername, profileUrl: input.profileUrl },
    },
  });

  return { profileUrl: input.profileUrl, sortType };
}
