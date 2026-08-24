import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  content: { findUnique: vi.fn(), findMany: vi.fn() },
  userRemote: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), delete: vi.fn() },
  contentRemote: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock('server/prisma', () => ({ default: prismaMock }));

import {
  getLocalContent,
  getLocalLatestContent,
  getLocalUser,
  getRemoteAllUsers,
  getRemoteCommentsOnLocalContent,
  getRemoteContent,
  getRemoteFriends,
  getRemoteUser,
  getRemoteUserByActor,
  removeOldRemoteContent,
  removeRemoteContent,
  removeRemoteUser,
  saveRemoteContent,
  saveRemoteUser,
} from 'server/social/db';
import { contentRemote, userRemote } from './fixtures';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getLocalUser', () => {
  it('returns null for an empty resource rather than querying', async () => {
    await expect(getLocalUser('')).resolves.toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ['a profile url', 'https://example.com/alice'],
    ['a url with a content path', 'https://example.com/alice/blog/hello'],
    ['an acct: uri', 'acct:alice@example.com'],
    ['a bare handle', 'alice@example.com'],
    ['a local path', '/alice'],
  ])('resolves the username from %s', async (_label, resource) => {
    await getLocalUser(resource);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { username: 'alice' } });
  });
});

describe('getLocalContent', () => {
  it('looks up on the username_name compound key', async () => {
    await getLocalContent('https://example.com/alice/blog/hello');

    expect(prismaMock.content.findUnique).toHaveBeenCalledWith({
      where: { username_name: { username: 'alice', name: 'hello' } },
    });
  });

  it('falls back to the home item when the url has no content path', async () => {
    await getLocalContent('https://example.com/alice');

    expect(prismaMock.content.findUnique).toHaveBeenCalledWith({
      where: { username_name: { username: 'alice', name: 'home' } },
    });
  });
});

describe('getLocalLatestContent', () => {
  it('only publishes visible, non-redirecting, non-index items', async () => {
    await getLocalLatestContent('https://example.com/alice/blog/hello');

    expect(prismaMock.content.findMany).toHaveBeenCalledWith({
      where: {
        username: 'alice',
        section: { not: 'main' },
        album: { not: 'main' },
        hidden: false,
        redirect: 0,
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 50,
    });
  });
});

describe('remote user lookups', () => {
  it('scopes a profile lookup to the local user', async () => {
    await getRemoteUser('alice', 'https://remote.example/bob');

    expect(prismaMock.userRemote.findUnique).toHaveBeenCalledWith({
      where: { localUsername_profileUrl: { localUsername: 'alice', profileUrl: 'https://remote.example/bob' } },
    });
  });

  it('scopes an actor lookup to the local user', async () => {
    await getRemoteUserByActor('alice', 'https://remote.example/users/bob');

    expect(prismaMock.userRemote.findUnique).toHaveBeenCalledWith({
      where: {
        localUsername_activityPubActorUrl: {
          localUsername: 'alice',
          activityPubActorUrl: 'https://remote.example/users/bob',
        },
      },
    });
  });

  it('only pulls feeds for users we still follow', async () => {
    await getRemoteAllUsers();

    expect(prismaMock.userRemote.findMany).toHaveBeenCalledWith({ where: { following: true } });
  });

  it('splits friends into followers and following', async () => {
    const followers = [userRemote({ id: 1, follower: true })];
    const following = [userRemote({ id: 2, following: true })];
    prismaMock.userRemote.findMany.mockResolvedValueOnce(followers).mockResolvedValueOnce(following);

    await expect(getRemoteFriends('https://example.com/alice')).resolves.toEqual([followers, following]);

    expect(prismaMock.userRemote.findMany).toHaveBeenNthCalledWith(1, {
      where: { localUsername: 'alice', follower: true },
    });
    expect(prismaMock.userRemote.findMany).toHaveBeenNthCalledWith(2, {
      where: { localUsername: 'alice', following: true },
    });
  });
});

describe('saveRemoteUser', () => {
  // Regression: the legacy id-based upsert clobbered existing rows when a
  // freshly-discovered user arrived with a sentinel id.
  it('upserts on the natural key and never writes an id or timestamps', async () => {
    const remote = userRemote({ id: -1 });

    await saveRemoteUser(remote);

    const call = prismaMock.userRemote.upsert.mock.calls[0][0];
    expect(call.where).toEqual({
      localUsername_profileUrl: { localUsername: 'alice', profileUrl: 'https://remote.example/bob' },
    });
    for (const payload of [call.update, call.create]) {
      expect(payload).not.toHaveProperty('id');
      expect(payload).not.toHaveProperty('createdAt');
      expect(payload).not.toHaveProperty('updatedAt');
      expect(payload.localUsername).toBe('alice');
      expect(payload.feedUrl).toBe('https://remote.example/bob/feed');
    }
  });

  it('deletes by id', async () => {
    await removeRemoteUser(userRemote({ id: 9 }));

    expect(prismaMock.userRemote.delete).toHaveBeenCalledWith({ where: { id: 9 } });
  });
});

describe('saveRemoteContent', () => {
  it('bulk-inserts an array while skipping duplicates', async () => {
    const entries = [contentRemote({ id: 1 }), contentRemote({ id: 2 })];

    await saveRemoteContent(entries);

    expect(prismaMock.contentRemote.createMany).toHaveBeenCalledWith({ data: entries, skipDuplicates: true });
    expect(prismaMock.contentRemote.create).not.toHaveBeenCalled();
  });

  it('upserts an existing item by id', async () => {
    await saveRemoteContent(contentRemote({ id: 20 }));

    const call = prismaMock.contentRemote.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ id: 20 });
    expect(call.update).not.toHaveProperty('id');
    expect(call.create).not.toHaveProperty('id');
  });

  // Regression: a sentinel id (-1/0) must autoincrement instead of forcing a
  // row id, which would clobber another new row.
  it.each([-1, 0])('creates (never upserts) an item carrying the sentinel id %i', async (id) => {
    await saveRemoteContent(contentRemote({ id }));

    expect(prismaMock.contentRemote.upsert).not.toHaveBeenCalled();
    expect(prismaMock.contentRemote.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.contentRemote.create.mock.calls[0][0].data).not.toHaveProperty('id');
  });
});

describe('getRemoteContent', () => {
  it('finds an item by local owner and link', async () => {
    await getRemoteContent('alice', 'https://remote.example/bob/1');

    expect(prismaMock.contentRemote.findFirst).toHaveBeenCalledWith({
      where: { toUsername: 'alice', link: 'https://remote.example/bob/1' },
    });
  });
});

describe('removeOldRemoteContent', () => {
  it('prunes only posts older than 30 days that nobody kept', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-30T00:00:00.000Z'));

    await removeOldRemoteContent();

    expect(prismaMock.contentRemote.deleteMany).toHaveBeenCalledWith({
      where: {
        type: 'post',
        favorited: false,
        localContentName: null,
        createdAt: { lt: '2026-05-31T00:00:00.000Z' },
      },
    });
    vi.useRealTimers();
  });
});

describe('removeRemoteContent', () => {
  it('deletes by the remote item identity, not the row id', async () => {
    await removeRemoteContent(contentRemote({ id: 20, type: 'favorite', postId: 'p1' }));

    expect(prismaMock.contentRemote.deleteMany).toHaveBeenCalledWith({
      where: { toUsername: 'alice', postId: 'p1', type: 'favorite' },
    });
  });
});

describe('getRemoteCommentsOnLocalContent', () => {
  it('excludes deleted and spam comments, newest first', async () => {
    await getRemoteCommentsOnLocalContent('https://example.com/alice/blog/hello');

    expect(prismaMock.contentRemote.findMany).toHaveBeenCalledWith({
      where: {
        toUsername: 'alice',
        localContentName: 'hello',
        deleted: false,
        isSpam: false,
        type: 'comment',
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  });
});
