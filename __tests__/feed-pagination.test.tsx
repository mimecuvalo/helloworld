import React, { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The dashboard feed paginates a set that shrinks behind you: items mark
// themselves read as they scroll past. These tests drive the real
// useFeedPaginated hook against the real fetchContentRemotePaginated, over an
// in-memory stand-in for prisma, and assert no page ever repeats or skips a row
// regardless of whether the read-writes commit before the next page is fetched.

const TOTAL = 60;
const PAGE = 20;

type Row = {
  id: number;
  postId: string;
  title: string;
  view: string;
  read: boolean;
  favorited: boolean;
  createdAt: Date;
  toUsername: string;
  type: string;
  deleted: boolean;
  isSpam: boolean;
  fromUsername: string;
};

let rows: Row[] = [];
let sortType: string | null = null;

function makeRows() {
  // Deliberately ties createdAt in pairs so the id tiebreaker is exercised.
  rows = Array.from({ length: TOTAL }, (_, i) => ({
    id: i + 1,
    postId: `p${i}`,
    // Only every fourth row is findable, and each half of the OR is exercised:
    // the term is in the title on some rows and in the body on others. Under a
    // page's worth of matches, so one fetch sees all of them.
    title: i % 8 === 0 ? `Needle ${i}` : `post ${i}`,
    view: i % 8 === 4 ? `<p>a needle in the body ${i}</p>` : `<p>body ${i}</p>`,
    read: false,
    favorited: true,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, Math.floor(i / 2))),
    toUsername: 'me',
    type: 'post',
    deleted: false,
    isSpam: false,
    fromUsername: 'https://example.com',
  })).reverse(); // newest first == p0
}

// Minimal prisma stand-in: equality filters, plus the AND/OR keyset predicate.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matches(row: Row, where: any): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND') return (value as unknown[]).every((w) => matches(row, w));
    if (key === 'OR') return (value as unknown[]).some((w) => matches(row, w));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actual = (row as any)[key];
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      return Object.entries(value).every(([op, operand]) => {
        const a = actual instanceof Date ? actual.getTime() : actual;
        const b = operand instanceof Date ? operand.getTime() : operand;
        if (op === 'lt') return a < (b as number);
        if (op === 'gt') return a > (b as number);
        if (op === 'contains')
          return (value as { mode?: string }).mode === 'insensitive'
            ? String(actual).toLowerCase().includes(String(operand).toLowerCase())
            : String(actual).includes(String(operand));
        if (op === 'mode') return true; // handled alongside `contains`
        throw new Error(`unhandled operator ${op}`);
      });
    }
    if (value instanceof Date) return (actual as Date).getTime() === value.getTime();
    return actual === value;
  });
}

const fakePrisma = {
  userRemote: { findUnique: async () => (sortType ? { sortType } : null) },
  contentRemote: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: async ({ where, orderBy, take }: any) => {
      const dir = orderBy[0].createdAt === 'desc' ? -1 : 1;
      return rows
        .filter((r) => matches(r, where))
        .sort((a, b) => (a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id) * dir)
        .slice(0, take);
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// The service module transitively imports prisma + social; stub them so it loads.
vi.mock('server/prisma', () => ({ default: {} }));
vi.mock('server/social', () => ({ syndicate: async () => {}, like: async () => {}, reblog: async () => {} }));

vi.mock('lib/rpc', () => ({
  rpc: {
    api: {
      'content-remote': {
        paginated: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          $get: async ({ query }: any) => {
            const { fetchContentRemotePaginated } = await import('server/services/content-remote');
            const results = await fetchContentRemotePaginated(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { currentUsername: 'me', prisma: fakePrisma } as any,
              {
                profileUrlOrSpecialFeed: query.profileUrlOrSpecialFeed,
                query: query.query,
                cursorCreatedAt: query.cursorCreatedAt,
                cursorId: query.cursorId === undefined ? undefined : Number(query.cursorId),
                shouldShowAllItems: query.shouldShowAllItems === 'true',
              }
            );
            // serialize the way hono's c.json would, so createdAt round-trips as ISO
            return { ok: true, json: async () => JSON.parse(JSON.stringify(results)) };
          },
        },
      },
    },
  },
}));

const { useFeedPaginated } = await import('lib/remote-queries');

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ids = (result: any): string[] => result.current.data.pages.flat().map((p: { postId: string }) => p.postId);

function markRead(postIds: string[]) {
  for (const id of postIds) {
    const row = rows.find((r) => r.postId === id);
    if (row) row.read = true;
  }
}

/** Pages through the feed, marking `readFraction` of each page read before fetching the next. */
async function pageThrough(feed: string, showAll: boolean, readFraction: number, pages = 3, query = '') {
  const { result } = renderHook(() => useFeedPaginated(feed, query, showAll), { wrapper });
  await waitFor(() => expect(result.current.isPending).toBe(false), { timeout: 3000 });
  expect(result.current.error).toBeNull();

  for (let i = 1; i < pages; i++) {
    const page = ids(result).slice(-PAGE);
    markRead(page.slice(0, Math.floor(page.length * readFraction)));
    await result.current.fetchNextPage();
    await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false), { timeout: 3000 });
  }
  return ids(result);
}

describe('feed pagination', () => {
  beforeEach(() => {
    makeRows();
    sortType = null;
  });

  it('never repeats a row when every read commits before the next page', async () => {
    const seen = await pageThrough('', false, 1);
    expect(seen).toHaveLength(60);
    expect(new Set(seen).size).toBe(60);
  });

  // The race: reaching the bottom fires the read-POSTs and the next-page GET on
  // the same scroll event, so the writes may not have landed when the page is read.
  it('never repeats a row when no read has committed yet', async () => {
    const seen = await pageThrough('', false, 0);
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toEqual(rows.slice(0, seen.length).map((r) => r.postId));
  });

  it('never repeats a row when reads commit partially', async () => {
    const seen = await pageThrough('', false, 0.6);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('does not skip rows that leave the set behind the cursor', async () => {
    const seen = await pageThrough('', false, 1);
    // every row is accounted for exactly once, in order, with nothing dropped
    expect(seen).toEqual(rows.map((r) => r.postId));
  });

  it('paginates a set that never shrinks ("view all items")', async () => {
    const seen = await pageThrough('https://example.com', true, 1);
    expect(seen).toHaveLength(60);
    expect(new Set(seen).size).toBe(60);
  });

  it('paginates the favorites feed', async () => {
    const seen = await pageThrough('favorites', false, 1);
    expect(seen).toHaveLength(60);
    expect(new Set(seen).size).toBe(60);
  });

  it('paginates oldest-first feeds', async () => {
    sortType = 'oldest';
    const seen = await pageThrough('https://example.com', false, 1);
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toEqual(
      [...rows]
        .reverse()
        .map((r) => r.postId)
        .slice(0, seen.length)
    );
  });

  it('stops paginating on a short page', async () => {
    rows = rows.slice(0, 5);
    const { result } = renderHook(() => useFeedPaginated('', '', false), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false), { timeout: 3000 });
    expect(result.current.hasNextPage).toBe(false);
  });
});

// The search box threads its term through the same hook. It used to end at the
// query key — the term never reached the request — so every search re-served
// the unfiltered feed.
describe('feed search', () => {
  beforeEach(() => {
    makeRows();
    sortType = null;
  });

  async function search(term: string) {
    const { result } = renderHook(() => useFeedPaginated('', term, false), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false), { timeout: 3000 });
    expect(result.current.error).toBeNull();
    return ids(result);
  }

  it('filters the feed to matching rows', async () => {
    const seen = await search('needle');
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.length).toBeLessThan(TOTAL);
    expect(seen.every((postId) => Number(postId.slice(1)) % 4 === 0)).toBe(true);
  });

  it('matches the title and the body, case-insensitively', async () => {
    expect(await search('NEEDLE')).toEqual(await search('needle'));
    // p0's term is in the title, p4's is in the body.
    const seen = await search('needle');
    expect(seen).toContain('p0');
    expect(seen).toContain('p4');
  });

  it('searches read items too', async () => {
    markRead(rows.map((r) => r.postId));
    expect(await search('needle')).not.toHaveLength(0);
    // ...while an unsearched feed still hides them.
    const { result } = renderHook(() => useFeedPaginated('', '', false), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false), { timeout: 3000 });
    expect(ids(result)).toHaveLength(0);
  });

  it('paginates a search past the first page', async () => {
    // 'body' is in every row, so the keyset cursor has to carry the filter too.
    const all = await pageThrough('', false, 1, 3, 'body');
    expect(all).toHaveLength(TOTAL);
    expect(new Set(all).size).toBe(all.length);
  });

  it('an empty term is not a filter', async () => {
    expect(await search('')).toHaveLength(PAGE);
  });
});
