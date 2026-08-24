import { beforeEach, describe, expect, it, vi } from 'vitest';

const discover = vi.hoisted(() => ({ discoverUserRemoteInfoSaveAndSubscribe: vi.fn() }));
const feeds = vi.hoisted(() => ({ retrieveFeed: vi.fn(), parseFeedAndInsertIntoDb: vi.fn() }));
const streams = vi.hoisted(() => ({ follow: vi.fn(), like: vi.fn() }));

vi.mock('server/social/discover-user', () => discover);
vi.mock('server/social/feeds', () => feeds);
vi.mock('server/social/activitystreams', () => streams);

import type { Context } from 'server/context';
import { like, subscribeToFeed, syndicate, unsubscribeFromFeed } from 'server/social';
import { HOST, content, contentRemote, user, userRemote } from './fixtures';

const prismaStub = () => ({
  userRemote: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
});

function context(overrides: Partial<Context> = {}, prisma = prismaStub()) {
  return {
    currentUsername: 'alice',
    currentUserEmail: 'alice@example.com',
    currentUserPicture: '',
    currentUser: user(),
    user: { email: 'alice@example.com' },
    hostname: HOST,
    prisma,
    loaders: {},
    request: new Request(`https://${HOST}`),
    ...overrides,
  } as unknown as Context;
}

const anonymous = () => context({ currentUser: null, currentUsername: '', user: undefined });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('syndicate', () => {
  it('is still a no-op and never throws', async () => {
    await expect(syndicate(context(), content())).resolves.toBeUndefined();
  });
});

describe('like', () => {
  it('sends a Like on behalf of the signed-in user', async () => {
    const remoteContent = contentRemote();
    const remote = userRemote();

    await like(context(), remoteContent, remote, true);

    expect(streams.like).toHaveBeenCalledWith(
      HOST,
      expect.objectContaining({ username: 'alice' }),
      remoteContent,
      remote,
      true
    );
  });

  it('passes the favorited flag straight through for an unlike', async () => {
    await like(context(), contentRemote(), userRemote(), false);

    expect(streams.like).toHaveBeenCalledWith(HOST, expect.anything(), expect.anything(), expect.anything(), false);
  });

  it('does nothing for an anonymous request', async () => {
    await like(anonymous(), contentRemote(), userRemote(), true);

    expect(streams.like).not.toHaveBeenCalled();
  });
});

describe('subscribeToFeed', () => {
  const remote = userRemote();

  it('discovers, backfills the feed and announces the Follow, in that order', async () => {
    discover.discoverUserRemoteInfoSaveAndSubscribe.mockResolvedValue(remote);
    feeds.retrieveFeed.mockResolvedValue('<feed/>');

    await expect(subscribeToFeed(context(), remote.profileUrl)).resolves.toBe(remote);

    expect(discover.discoverUserRemoteInfoSaveAndSubscribe).toHaveBeenCalledWith(remote.profileUrl, 'alice');
    expect(feeds.retrieveFeed).toHaveBeenCalledWith(remote.feedUrl);
    expect(feeds.parseFeedAndInsertIntoDb).toHaveBeenCalledWith(remote, '<feed/>');
    expect(streams.follow).toHaveBeenCalledWith(HOST, expect.objectContaining({ username: 'alice' }), remote, true);
  });

  it('returns null without touching the feed when discovery fails', async () => {
    discover.discoverUserRemoteInfoSaveAndSubscribe.mockResolvedValue(null);

    await expect(subscribeToFeed(context(), 'https://remote.example/nobody')).resolves.toBeNull();

    expect(feeds.retrieveFeed).not.toHaveBeenCalled();
    expect(streams.follow).not.toHaveBeenCalled();
  });

  it('refuses an anonymous subscribe', async () => {
    await expect(subscribeToFeed(anonymous(), remote.profileUrl)).resolves.toBeNull();

    expect(discover.discoverUserRemoteInfoSaveAndSubscribe).not.toHaveBeenCalled();
  });
});

describe('unsubscribeFromFeed', () => {
  it('deletes a one-way follow outright', async () => {
    const prisma = prismaStub();
    const remote = userRemote({ id: 7, follower: false });
    prisma.userRemote.findUnique.mockResolvedValue(remote);

    await expect(unsubscribeFromFeed(context({}, prisma), remote.profileUrl)).resolves.toBe(true);

    expect(prisma.userRemote.findUnique).toHaveBeenCalledWith({
      where: { localUsername_profileUrl: { localUsername: 'alice', profileUrl: remote.profileUrl } },
    });
    expect(prisma.userRemote.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(prisma.userRemote.update).not.toHaveBeenCalled();
  });

  // Deleting a follower would drop their side of the relationship too.
  it('keeps a mutual as a follower and only clears following', async () => {
    const prisma = prismaStub();
    const remote = userRemote({ id: 7, follower: true });
    prisma.userRemote.findUnique.mockResolvedValue(remote);

    await expect(unsubscribeFromFeed(context({}, prisma), remote.profileUrl)).resolves.toBe(true);

    expect(prisma.userRemote.update).toHaveBeenCalledWith({ data: { following: false }, where: { id: 7 } });
    expect(prisma.userRemote.delete).not.toHaveBeenCalled();
  });

  it('sends the Undo Follow after updating our own state', async () => {
    const prisma = prismaStub();
    const remote = userRemote({ id: 7 });
    prisma.userRemote.findUnique.mockResolvedValue(remote);

    await unsubscribeFromFeed(context({}, prisma), remote.profileUrl);

    expect(streams.follow).toHaveBeenCalledWith(HOST, expect.objectContaining({ username: 'alice' }), remote, false);
  });

  it('reports false for a user we never followed', async () => {
    const prisma = prismaStub();
    prisma.userRemote.findUnique.mockResolvedValue(null);

    await expect(unsubscribeFromFeed(context({}, prisma), 'https://remote.example/nobody')).resolves.toBe(false);

    expect(streams.follow).not.toHaveBeenCalled();
  });

  it('refuses an anonymous unsubscribe', async () => {
    await expect(unsubscribeFromFeed(anonymous(), 'https://remote.example/bob')).resolves.toBe(false);
  });
});
