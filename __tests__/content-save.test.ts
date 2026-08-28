import { beforeEach, describe, expect, it, vi } from 'vitest';

const social = vi.hoisted(() => ({
  syndicate: vi.fn(),
  threadUserFor: vi.fn(async () => null),
  unsyndicate: vi.fn(),
}));

vi.mock('server/social', () => social);

import type { Context } from 'server/context';
import type { Content } from 'generated/prisma/client';
import { createContainer, deleteContent, fetchContent, saveContent } from 'server/services/content';

// Sections and albums are rows like any other — a section is one filed at
// section 'main', an album one at album 'main' — and everything underneath finds
// its way home through those two string columns. So renaming, hiding or moving
// one has to rewrite its children in the same breath, or the collection queries
// stop finding them.

type Row = Partial<Content> & { id: number; username: string; section: string; album: string; name: string };

let rows: Row[];
let nextId: number;

function matches(row: Row, where: Record<string, unknown>) {
  return Object.entries(where).every(([key, value]) => (row as Record<string, unknown>)[key] === value);
}

function context(): Context {
  const client = {
    // Models a transaction the only way an array can: snapshot going in, restore
    // on the way out if the callback throws. That makes the rollback test mean
    // something — a write moved back outside the callback stops being covered.
    $transaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
      const snapshot = rows.map((row) => ({ ...row }));
      try {
        return await fn(client);
      } catch (ex) {
        rows = snapshot;
        throw ex;
      }
    },
    content: {
      findUnique: vi.fn(
        async ({ where }: { where: { id?: number; username_name?: { username: string; name: string } } }) => {
          const key = where.username_name;
          if (!key) return rows.find((row) => row.id === where.id) || null;
          return rows.find((row) => row.username === key.username && row.name === key.name) || null;
        }
      ),
      update: vi.fn(async ({ data, where }: { data: Partial<Row>; where: { username_name: { name: string } } }) => {
        const row = rows.find((r) => r.name === where.username_name.name)!;
        Object.assign(row, data);
        return row;
      }),
      updateMany: vi.fn(async ({ data, where }: { data: Partial<Row>; where: Record<string, unknown> }) => {
        const hits = rows.filter((row) => matches(row, where));
        for (const row of hits) Object.assign(row, data);
        return { count: hits.length };
      }),
      create: vi.fn(async ({ data }: { data: Row }) => {
        const row = { ...data, id: ++nextId };
        rows.push(row);
        return row;
      }),
      delete: vi.fn(
        async ({ where }: { where: { id?: number; username_name?: { username: string; name: string } } }) => {
          const key = where.username_name;
          const at = rows.findIndex((row) =>
            key ? row.username === key.username && row.name === key.name : row.id === where.id
          );
          return at < 0 ? null : rows.splice(at, 1)[0];
        }
      ),
      findFirst: vi.fn(
        async ({ where }: { where: Record<string, unknown> }) => rows.find((row) => matches(row, where)) || null
      ),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        rows.filter((row) => matches(row, where))
      ),
      deleteMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        const kept = rows.filter((row) => !matches(row, where));
        const count = rows.length - kept.length;
        rows = kept;
        return { count };
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
  return { id: ++nextId, username: 'alice', hidden: false, ...fields };
}

const save = (args: Parameters<typeof saveContent>[1]) => saveContent(context(), args);
const base = { title: 'photos', hidden: false, view: '' };
const named = (name: string) => rows.find((r) => r.name === name);

beforeEach(() => {
  vi.clearAllMocks();
  nextId = 0;
  rows = [];
});

describe('renaming a section', () => {
  beforeEach(() => {
    rows = [
      row({ section: 'main', album: '', name: 'photos' }),
      row({ section: 'photos', album: 'main', name: 'rome' }),
      row({ section: 'photos', album: 'rome', name: 'colosseum' }),
      row({ section: 'photos', album: '', name: 'loose-shot' }),
      row({ section: 'links', album: '', name: 'elsewhere' }),
    ];
  });

  it('brings everything filed under it along', async () => {
    await save({ ...base, name: 'photos', newName: 'pictures' });

    expect(named('pictures')).toMatchObject({ section: 'main', album: '' });
    expect(named('rome')).toMatchObject({ section: 'pictures', album: 'main' });
    expect(named('colosseum')).toMatchObject({ section: 'pictures', album: 'rome' });
    expect(named('loose-shot')).toMatchObject({ section: 'pictures', album: '' });
    // A different section has no business moving.
    expect(named('elsewhere')).toMatchObject({ section: 'links' });
  });

  it('leaves a redirect behind at the old url', async () => {
    await save({ ...base, name: 'photos', newName: 'pictures' });

    const stub = rows.find((r) => r.name === 'photos')!;
    expect(stub.redirect).toBe(named('pictures')!.id);
    expect(stub).toMatchObject({ section: 'main', album: '' });
  });

  it('skips the redirect for hidden content, which was never linked anywhere', async () => {
    await save({ ...base, name: 'photos', newName: 'pictures', hidden: true });

    expect(rows.find((r) => r.name === 'photos')).toBeUndefined();
  });

  it('takes back a name that only a stub from an earlier rename is holding', async () => {
    await save({ ...base, name: 'photos', newName: 'pictures' });
    // The stub now sits at 'photos'. Changing your mind has to be allowed.
    await save({ ...base, name: 'pictures', newName: 'photos' });

    expect(named('photos')).toMatchObject({ section: 'main', album: '', title: 'photos' });
    // The real row, not the stub that was sitting there.
    expect(named('photos')?.redirect).toBeFalsy();
    expect(rows.filter((r) => r.name === 'photos')).toHaveLength(1);
    // ...and the signpost now stands at the name that was just vacated.
    expect(named('pictures')?.redirect).toBe(named('photos')!.id);
  });

  it('refuses a name something else already holds', async () => {
    expect(await save({ ...base, name: 'photos', newName: 'elsewhere' })).toEqual({ error: 'duplicate-name' });
    expect(named('photos')).toBeTruthy();
  });

  it('refuses to rename the pages the site navigates by', async () => {
    rows.push(row({ section: 'main', album: '', name: 'home' }));

    expect(await save({ ...base, name: 'home', newName: 'front' })).toEqual({ error: 'structural-name' });
  });

  it('has nowhere to move to', async () => {
    expect(await save({ ...base, name: 'photos', section: 'links' })).toEqual({ error: 'cannot-nest-section' });
  });
});

describe('when a write fails partway', () => {
  beforeEach(() => {
    rows = [
      row({ section: 'main', album: '', name: 'photos' }),
      row({ section: 'photos', album: 'main', name: 'rome' }),
      row({ section: 'photos', album: 'rome', name: 'colosseum' }),
    ];
  });

  it('leaves nothing half-moved', async () => {
    const ctx = context();
    // The children are rewritten first, the row itself second. Fail on the row
    // and the old code would have left the children pointing at a section that
    // no longer exists.
    (ctx.prisma.content.update as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('boom'));

    await expect(saveContent(ctx, { ...base, name: 'photos', newName: 'pictures' })).rejects.toThrow('boom');

    expect(named('photos')).toBeTruthy();
    expect(named('rome')).toMatchObject({ section: 'photos' });
    expect(named('colosseum')).toMatchObject({ section: 'photos', album: 'rome' });
  });
});

describe('hiding a container', () => {
  beforeEach(() => {
    rows = [
      row({ section: 'main', album: '', name: 'photos' }),
      row({ section: 'photos', album: 'main', name: 'rome' }),
      row({ section: 'photos', album: 'rome', name: 'colosseum' }),
    ];
  });

  it('hides what is inside it', async () => {
    await save({ ...base, name: 'photos', hidden: true });

    expect(named('rome')?.hidden).toBe(true);
    expect(named('colosseum')?.hidden).toBe(true);
  });

  it('unhides them again', async () => {
    for (const r of rows) r.hidden = true;

    await save({ ...base, name: 'rome', hidden: false });

    expect(named('colosseum')?.hidden).toBe(false);
    // Only this album's contents; the section above it stays as it was.
    expect(named('photos')?.hidden).toBe(true);
  });
});

describe('moving an album', () => {
  beforeEach(() => {
    rows = [
      row({ section: 'main', album: '', name: 'photos' }),
      row({ section: 'main', album: '', name: 'travel' }),
      row({ section: 'photos', album: 'main', name: 'rome' }),
      row({ section: 'photos', album: 'rome', name: 'colosseum' }),
      row({ section: 'photos', album: '', name: 'loose-shot' }),
    ];
  });

  it('takes its contents to the new section', async () => {
    await save({ ...base, name: 'rome', section: 'travel', album: 'main' });

    expect(named('rome')).toMatchObject({ section: 'travel', album: 'main' });
    expect(named('colosseum')).toMatchObject({ section: 'travel', album: 'rome' });
    // Not in the album, so not part of the move.
    expect(named('loose-shot')).toMatchObject({ section: 'photos', album: '' });
  });

  it('becomes a section of its own when sent to main', async () => {
    await save({ ...base, name: 'rome', section: 'main', album: '' });

    expect(named('rome')).toMatchObject({ section: 'main', album: '' });
    expect(named('colosseum')).toMatchObject({ section: 'rome', album: '' });
  });

  it('handles a rename and a move at once', async () => {
    await save({ ...base, name: 'rome', newName: 'roma', section: 'travel', album: 'main' });

    expect(named('roma')).toMatchObject({ section: 'travel', album: 'main' });
    expect(named('colosseum')).toMatchObject({ section: 'travel', album: 'roma' });
  });
});

describe('a plain item', () => {
  beforeEach(() => {
    rows = [
      row({ section: 'main', album: '', name: 'photos' }),
      row({ section: 'photos', album: 'main', name: 'rome' }),
      row({ section: 'photos', album: '', name: 'loose-shot' }),
    ];
  });

  it('files itself into an album without disturbing anything', async () => {
    await save({ ...base, name: 'loose-shot', section: 'photos', album: 'rome' });

    expect(named('loose-shot')).toMatchObject({ section: 'photos', album: 'rome' });
    expect(named('rome')).toMatchObject({ section: 'photos', album: 'main' });
  });

  it('writes the fields the tabs edit', async () => {
    await save({
      ...base,
      name: 'loose-shot',
      title: 'A shot',
      view: '<p>hi</p>',
      style: 'p { color: red }',
      code: 'console.info(1)',
      template: 'blank',
      thumb: '/resource/thumb.jpg',
    });

    expect(named('loose-shot')).toMatchObject({
      title: 'A shot',
      view: '<p>hi</p>',
      style: 'p { color: red }',
      code: 'console.info(1)',
      template: 'blank',
      thumb: '/resource/thumb.jpg',
    });
  });

  it('slugifies a name typed with spaces and punctuation', async () => {
    await save({ ...base, name: 'loose-shot', newName: 'A Shot! Of Rome' });

    expect(named('a-shot-of-rome')).toBeTruthy();
  });
});

describe('the stub a rename leaves behind', () => {
  beforeEach(() => {
    rows = [row({ section: 'writing', album: '', name: 'a-post', title: 'A post', view: '<p>hi</p>' })];
  });

  it('serves the renamed row from the old url', async () => {
    await save({ ...base, name: 'a-post', newName: 'a-better-name', view: '<p>hi</p>' });

    const served = await fetchContent(context(), { username: 'alice', name: 'a-post' });

    expect(served).toMatchObject({ name: 'a-better-name', view: '<p>hi</p>' });
  });

  it('is cleared away when the row it points at is deleted', async () => {
    await save({ ...base, name: 'a-post', newName: 'a-better-name' });
    await deleteContent(context(), { name: 'a-better-name' });

    expect(rows).toHaveLength(0);
  });

  it('is a 404, not an empty page, when it points at nothing', async () => {
    await save({ ...base, name: 'a-post', newName: 'a-better-name' });
    // However it happened — a direct edit, an older delete — the target is gone.
    rows = rows.filter((r) => r.name !== 'a-better-name');

    expect(await fetchContent(context(), { username: 'alice', name: 'a-post' })).toBeNull();
  });
});

describe('making a section or an album', () => {
  beforeEach(() => {
    rows = [
      row({ section: 'main', album: '', name: 'photos' }),
      row({ section: 'main', album: '', name: 'drafts', hidden: true }),
    ];
  });

  const create = (args: Parameters<typeof createContainer>[1]) => createContainer(context(), args);

  it('files a section at the top level, listing what goes into it', async () => {
    const result = await create({ kind: 'section', title: 'Travel Notes' });

    expect(result).toMatchObject({ section: 'main', album: '', name: 'travel-notes', title: 'Travel Notes' });
    // A blank template renders the section's own body and never its children,
    // which is the one thing a section is for.
    expect(named('travel-notes')).toMatchObject({ template: 'latest', hidden: false, view: '' });
  });

  it('puts a new container after its siblings, not ahead of them', async () => {
    rows = [
      row({ section: 'main', album: '', name: 'photos', order: 1 }),
      row({ section: 'main', album: '', name: 'writing', order: 4 }),
      row({ section: 'photos', album: 'main', name: 'rome', order: 2 }),
    ];

    // The nav sorts on `order`, and the default 0 would jump the queue.
    await create({ kind: 'section', title: 'Travel' });
    expect(named('travel')?.order).toBe(5);

    await create({ kind: 'album', title: 'Paris', section: 'photos' });
    expect(named('paris')?.order).toBe(3);
  });

  it('hangs an album off the section it was asked for', async () => {
    const result = await create({ kind: 'album', title: 'Rome', section: 'photos' });

    expect(result).toMatchObject({ section: 'photos', album: 'main', name: 'rome' });
    expect(named('rome')).toMatchObject({ template: 'album' });
  });

  it('starts an album in a hidden section hidden, the way a post filed there would', async () => {
    await create({ kind: 'album', title: 'Rome', section: 'drafts' });

    expect(named('rome')?.hidden).toBe(true);
  });

  it('refuses a name already taken, or one the site navigates by', async () => {
    expect(await create({ kind: 'section', title: 'photos' })).toEqual({ error: 'duplicate-name' });
    expect(await create({ kind: 'section', title: 'home' })).toEqual({ error: 'reserved-name' });
    expect(await create({ kind: 'section', title: '!!!' })).toEqual({ error: 'invalid-name' });
    expect(rows).toHaveLength(2);
  });

  it('refuses an album under something that is not a section', async () => {
    rows.push(row({ section: 'photos', album: 'main', name: 'rome' }));

    expect(await create({ kind: 'album', title: 'Forum', section: 'rome' })).toEqual({ error: 'no-such-section' });
    expect(await create({ kind: 'album', title: 'Forum', section: 'nope' })).toEqual({ error: 'no-such-section' });
  });

  it('never syndicates: a container is structure, not something written', async () => {
    await create({ kind: 'section', title: 'Travel' });

    expect(social.syndicate).not.toHaveBeenCalled();
  });
});
