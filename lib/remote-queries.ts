import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { rpc } from 'lib/rpc';

export type RemoteUser = {
  username: string;
  name: string;
  profileUrl: string;
  avatar?: string | null;
  favicon?: string | null;
  sortType?: string | null;
  following?: boolean | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RemotePost = any;

export type HandleSetFeed = (feed: RemoteUser | string, query?: string, allItems?: boolean) => void;

const FEED_PAGE_SIZE = 20;

export function useFeedPaginated(profileUrlOrSpecialFeed: string, query: string, shouldShowAllItems: boolean) {
  return useInfiniteQuery({
    queryKey: ['feed-paginated', profileUrlOrSpecialFeed, query, shouldShowAllItems],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await rpc.api['content-remote'].paginated.$get({
        query: {
          profileUrlOrSpecialFeed,
          offset: String(pageParam),
          shouldShowAllItems: String(shouldShowAllItems),
        },
      });
      if (!res.ok) throw new Error('Failed to load feed');
      return (await res.json()) as RemotePost[];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < FEED_PAGE_SIZE ? undefined : allPages.reduce((n, p) => n + p.length, 0),
  });
}

export function useFollowing() {
  return useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      const res = await rpc.api['users-remote'].following.$get();
      if (!res.ok) throw new Error('Failed to load following');
      return (await res.json()) as RemoteUser[];
    },
  });
}

export function useFollowers() {
  return useQuery({
    queryKey: ['followers'],
    queryFn: async () => {
      const res = await rpc.api['users-remote'].followers.$get();
      if (!res.ok) throw new Error('Failed to load followers');
      return (await res.json()) as RemoteUser[];
    },
  });
}

export function useFeedCounts() {
  return useQuery({
    queryKey: ['feed-counts'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await rpc.api['content-remote']['feed-counts'].$get();
      if (!res.ok) throw new Error('Failed to load feed counts');
      return (await res.json()) as { fromUsername: string; count: number }[];
    },
  });
}

export function useTotalCounts() {
  return useQuery({
    queryKey: ['total-counts'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await rpc.api['content-remote'].counts.$get();
      if (!res.ok) throw new Error('Failed to load counts');
      return (await res.json()) as { totalCount: number; favoritesCount: number; commentsCount: number };
    },
  });
}
