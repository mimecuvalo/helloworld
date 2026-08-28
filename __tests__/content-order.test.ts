import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server/social', () => ({ syndicate: vi.fn(), threadUserFor: vi.fn(async () => null), unsyndicate: vi.fn() }));

import type { Context } from 'server/context';
import type { Content } from 'generated/prisma/client';
import { fetchSiteMap, orderContent } from 'server/services/content';

// The sidebar's order lives in one integer column shared by every row, so the
// only thing keeping it meaningful is that a reorder renumbers exactly the group
// that was dragged in — the top-level rows, or one section's albums — and
// nothing else. These tests are about that boundary, and about refusing when the
// group the client describes is not the group the database has.

type Row = Partial<Content> & { id: number; username: string; section: string; album: string; name: string };

let rows: Row[];
let nextId: number;

function matches(row: Row, where: Record<string, unknown>) {
  return Object.entries(where).every(([key, value]) => {
    const actual = (row as Record<string, unknown>)[key];
    if (value && typeof value === 'object' && 'notIn' in (value as object)) {
      return !(value as { notIn: unknown[] }).notIn.includes(actual);
    }
    if (value && typeof value === 'object' && 'in' in (value as object)) {
      return (value as { in: unknown[] }).in.includes(actual);
    }
    return actual === value;
  });
}

function context(): Context {
  const client = {
    // orderContent hands $transaction an array of updates rather than a
    // callback: every row in the group is renumbered or none is.
    $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
    content: {
      findMany: vi.fn(
        async ({ where, orderBy }: { where: Record<string, unknown>; orderBy?: { [key: string]: string }[] }) => {
          const hits = rows.filter((row) => matches(row, where));
          if (orderBy?.some((by) => by.order)) hits.sort((a, b) => (a.order || 0) - (b.order || 0));
          return hits;
        }
      ),
      update: vi.fn(async ({ data, where }: { data: Partial<Row>; where: { username_name: { name: string } } }) => {
        const row = rows.find((r) => r.name === where.username_name.name)!;
        Object.assign(row, data);
        return row;
      }),
    },
  };

  return {
    currentUsername: 'alice',
    currentUser: null,
    fullUser: async () => null,
    hostname: 'example.com',
    prisma: client,
  } as unknown as Context;
}

function row(fields: Partial<Row> & { name: string; section: string; album: string }): Row {
  return { id: ++nextId, username: 'alice', hidden: false, redirect: 0, order: 0, title: fields.name, ...fields };
}

const orderOf = (...names: string[]) => names.map((name) => rows.find((r) => r.name === name)!.order);

beforeEach(() => {
  vi.clearAllMocks();
  nextId = 0;
  rows = [
    row({ section: 'main', album: '', name: 'photos', order: 0 }),
    row({ section: 'photos', album: 'main', name: 'rome', order: 0 }),
    row({ section: 'photos', album: 'main', name: 'paris', order: 1 }),
    row({ section: 'photos', album: 'rome', name: 'colosseum' }),
    row({ section: 'main', album: '', name: 'links', order: 1 }),
    row({ section: 'main', album: '', name: 'about', order: 2 }),
    // Never in the sidebar, so never renumbered: the structural pages, and the
    // signpost a rename left behind.
    row({ section: 'main', album: '', name: 'home' }),
    row({ section: 'main', album: '', name: 'pictures', redirect: 1 }),
  ];
});

describe('reordering the top level', () => {
  it('renumbers the sections by the order it was given', async () => {
    await orderContent(context(), { section: 'main', names: ['about', 'photos', 'links'] });

    expect(orderOf('about', 'photos', 'links')).toEqual([0, 1, 2]);
  });

  it('is what the sitemap then draws', async () => {
    await orderContent(context(), { section: 'main', names: ['about', 'photos', 'links'] });
    const siteMap = await fetchSiteMap(context(), { username: 'alice' });

    expect(siteMap.map((item: { name: string }) => item.name)).toEqual(['about', 'photos', 'rome', 'paris', 'links']);
  });

  it('leaves the albums inside a moved section alone', async () => {
    await orderContent(context(), { section: 'main', names: ['about', 'photos', 'links'] });

    expect(orderOf('rome', 'paris')).toEqual([0, 1]);
  });
});

describe('reordering one section’s albums', () => {
  it('renumbers only that section', async () => {
    await orderContent(context(), { section: 'photos', names: ['paris', 'rome'] });

    expect(orderOf('paris', 'rome')).toEqual([0, 1]);
    expect(orderOf('photos', 'links', 'about')).toEqual([0, 1, 2]);
  });

  it('refuses a page that is filed in the album rather than being one', async () => {
    const result = await orderContent(context(), { section: 'photos', names: ['paris', 'rome', 'colosseum'] });

    expect(result).toEqual({ error: 'stale-order' });
    expect(orderOf('paris', 'rome')).toEqual([1, 0]);
  });
});

describe('a sitemap that has gone stale', () => {
  it('refuses a list missing something the group still has', async () => {
    const result = await orderContent(context(), { section: 'main', names: ['about', 'photos'] });

    expect(result).toEqual({ error: 'stale-order' });
    expect(orderOf('photos', 'links', 'about')).toEqual([0, 1, 2]);
  });

  it('refuses a list naming something that is not in the group', async () => {
    const result = await orderContent(context(), { section: 'main', names: ['about', 'photos', 'rome'] });

    expect(result).toEqual({ error: 'stale-order' });
  });

  it('refuses the structural pages and rename stubs the sidebar never showed', async () => {
    const result = await orderContent(context(), { section: 'main', names: ['home', 'photos', 'links', 'about'] });

    expect(result).toEqual({ error: 'stale-order' });
  });
});

describe('someone else’s content', () => {
  it('is invisible to the renumber, so the list looks stale rather than moving', async () => {
    rows.push(row({ username: 'bob', section: 'main', album: '', name: 'bobs-page' }));

    const result = await orderContent(context(), {
      section: 'main',
      names: ['bobs-page', 'photos', 'links', 'about'],
    });

    expect(result).toEqual({ error: 'stale-order' });
    expect(rows.find((r) => r.name === 'bobs-page')!.order).toBe(0);
  });
});
