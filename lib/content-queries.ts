import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { rpc } from 'lib/rpc';

type CollectionArgs = { username: string; section: string; album: string; name: string };
type LatestArgs = { username: string; section: string; name: string };
type FeedArgs = { username: string; section: string; name: string };

export type CollectionItem = {
  username: string;
  section: string;
  album: string;
  name: string;
  title?: string | null;
  thumb: string;
  hidden?: boolean | null;
  forceRefresh?: boolean | null;
  prefetchImages?: string[] | null;
  template?: string | null;
  view: string;
  style?: string | null;
  code?: string | null;
  count?: number;
  countRobot?: number;
  createdAt?: string;
  thread?: string | null;
};

export function useCollection(args: CollectionArgs) {
  return useQuery({
    queryKey: ['collection', args],
    queryFn: async () => {
      const res = await rpc.api.content.collection.$get({ query: args });
      if (!res.ok) throw new Error('Failed to load collection');
      return (await res.json()) as CollectionItem[];
    },
  });
}

export type EditableContent = {
  section: string;
  album: string;
  name: string;
  title: string;
  template: string | null;
  thumb: string;
  hidden: boolean;
  style: string;
  code: string;
  view: string;
};

export type SiteMapItem = {
  username: string;
  section: string;
  album: string;
  name: string;
  title?: string | null;
  hidden?: boolean | null;
};

// The author's own row, unmerged: fetchContent folds the section's and album's
// css/js into what it serves, and the editor must not write that back down.
export function useEditableContent(name: string, enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ['editable', name],
    queryFn: async () => {
      const res = await rpc.api.content.editable.$get({ query: { name } });
      if (!res.ok) throw new Error('Failed to load content for editing');
      return (await res.json()) as EditableContent | null;
    },
  });
}

export function useSiteMap(username: string, enabled = true) {
  return useQuery({
    enabled: enabled && !!username,
    queryKey: ['sitemap', username],
    queryFn: async () => {
      const res = await rpc.api.content.sitemap.$get({ query: { username } });
      if (!res.ok) throw new Error('Failed to load sitemap');
      return (await res.json()) as SiteMapItem[];
    },
  });
}

export function useCollectionLatest(args: LatestArgs) {
  return useQuery({
    queryKey: ['collection-latest', args],
    queryFn: async () => {
      const res = await rpc.api.content['collection-latest'].$get({ query: args });
      if (!res.ok) throw new Error('Failed to load latest');
      return (await res.json()) as CollectionItem | null;
    },
  });
}

const FEED_PAGE_SIZE = 20; // must match `take` in server fetchCollectionPaginated

export function useCollectionPaginated(args: FeedArgs) {
  return useInfiniteQuery({
    queryKey: ['collection-paginated', args],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await rpc.api.content['collection-paginated'].$get({
        query: { ...args, offset: String(pageParam) },
      });
      if (!res.ok) throw new Error('Failed to load feed');
      return (await res.json()) as CollectionItem[];
    },
    // Stop paginating once a page comes back short of a full batch.
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < FEED_PAGE_SIZE ? undefined : allPages.reduce((n, p) => n + p.length, 0),
  });
}
