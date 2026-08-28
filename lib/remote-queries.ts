import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { rpc } from 'lib/rpc';

export type RemoteUser = {
  username: string;
  name: string;
  profileUrl: string;
  avatar?: string | null;
  favicon?: string | null;
  sortType?: string | null;
  follower?: boolean | null;
  following?: boolean | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RemotePost = any;

export type HandleSetFeed = (feed: RemoteUser | string, query?: string, allItems?: boolean) => void;

const FEED_PAGE_SIZE = 20;

// A sort position, not a row index — the unread feed shrinks behind you as
// items are marked read, and only a keyset cursor survives that.
type FeedCursor = { createdAt: string; id: number };

export function useFeedPaginated(profileUrlOrSpecialFeed: string, query: string, shouldShowAllItems: boolean) {
  return useInfiniteQuery({
    queryKey: ['feed-paginated', profileUrlOrSpecialFeed, query, shouldShowAllItems],
    initialPageParam: null as FeedCursor | null,
    queryFn: async ({ pageParam }) => {
      const res = await rpc.api['content-remote'].paginated.$get({
        // One object literal, not a conditional spread: excess-property checking
        // doesn't see through a spread, so a mistyped param name would compile.
        // hono's buildSearchParams drops undefined values from the query string.
        query: {
          profileUrlOrSpecialFeed,
          shouldShowAllItems: String(shouldShowAllItems),
          cursorCreatedAt: pageParam?.createdAt,
          cursorId: pageParam ? String(pageParam.id) : undefined,
        },
      });
      if (!res.ok) throw new Error('Failed to load feed');
      return (await res.json()) as RemotePost[];
    },
    getNextPageParam: (lastPage): FeedCursor | undefined => {
      if (lastPage.length < FEED_PAGE_SIZE) return undefined;
      const last = lastPage[lastPage.length - 1];
      return { createdAt: last.createdAt, id: last.id };
    },
  });
}

type Relations = { following: RemoteUser[]; followers: RemoteUser[] };

// One request behind both nav lists. The two hooks below select their half of
// it, so they share a single fetch and a single cache entry to invalidate.
const relationsQuery = {
  queryKey: ['relations'],
  queryFn: async (): Promise<Relations> => {
    const res = await rpc.api['users-remote'].relations.$get();
    if (!res.ok) throw new Error('Failed to load follows');
    return (await res.json()) as Relations;
  },
};

export function useFollowing() {
  return useQuery({ ...relationsQuery, select: (data: Relations) => data.following });
}

export function useFollowers() {
  return useQuery({ ...relationsQuery, select: (data: Relations) => data.followers });
}

export type Counts = {
  totalCount: number;
  favoritesCount: number;
  commentsCount: number;
  feeds: { fromUsername: string; count: number }[];
};

export function useCounts() {
  return useQuery({
    queryKey: ['counts'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await rpc.api['content-remote'].counts.$get();
      if (!res.ok) throw new Error('Failed to load counts');
      return (await res.json()) as Counts;
    },
  });
}
