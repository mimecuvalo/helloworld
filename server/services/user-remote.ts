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

// Both sides of the dashboard's nav in one round trip. They're the same table
// filtered on two booleans, and a mutual follow used to be serialized down
// twice — one query and a split is both fewer requests and less payload.
export async function fetchRelations(ctx: Context) {
  const rows = await ctx.prisma.userRemote.findMany({
    select: {
      username: true,
      name: true,
      profileUrl: true,
      avatar: true,
      favicon: true,
      sortType: true,
      follower: true,
      following: true,
    },
    where: { localUsername: ctx.currentUsername, OR: [{ following: true }, { follower: true }] },
    orderBy: [{ order: 'asc' }, { username: 'asc' }],
  });

  // Following keeps the hand-ordered sequence above; followers were only ever
  // sorted by name, and `order` is meaningless for a feed you don't follow.
  const followers = rows.filter((row) => row.follower).sort((a, b) => a.username.localeCompare(b.username));

  return { following: rows.filter((row) => row.following), followers };
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
