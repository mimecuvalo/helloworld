import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ getRemoteContent: vi.fn(), saveRemoteContent: vi.fn() }));
const prismaMock = vi.hoisted(() => ({
  default: { user: { update: vi.fn() }, content: { update: vi.fn(), findFirst: vi.fn() } },
}));
const agentMock = vi.hoisted(() => ({
  login: vi.fn(),
  resumeSession: vi.fn(),
  follow: vi.fn(),
  deleteFollow: vi.fn(),
  session: undefined as { did: string } | undefined,
  like: vi.fn(),
  deleteLike: vi.fn(),
  repost: vi.fn(),
  deleteRepost: vi.fn(),
  com: { atproto: { repo: { putRecord: vi.fn(), deleteRecord: vi.fn(), uploadBlob: vi.fn() } } },
  app: {
    bsky: {
      feed: { getAuthorFeed: vi.fn(), getPosts: vi.fn() },
      actor: { getProfile: vi.fn() },
      graph: { getFollowers: vi.fn() },
    },
  },
}));

vi.mock('server/social/db', () => db);
vi.mock('server/prisma', () => prismaMock);
// `new AtpAgent(...)` needs a real constructor, so these are function
// declarations rather than arrows.
vi.mock('@atproto/api', () => ({
  AtpAgent: function AtpAgent() {
    return agentMock;
  },
  RichText: function RichText() {
    return { detectFacets: vi.fn(), facets: [{ index: { byteStart: 0, byteEnd: 1 } }] };
  },
}));

import {
  deleteFromBluesky,
  followOnBluesky,
  getAgent,
  hasBlueskyCredentials,
  isAtprotoUserRemote,
  likeOnBluesky,
  mapAtprotoFeedIntoDb,
  publishToBluesky,
  repostOnBluesky,
} from 'server/social/atproto';
import { rkeyFor } from 'server/social/atproto-records';
import { HOST, content, user, userRemote } from './fixtures';

const linked = (overrides = {}) =>
  user({ atprotoHandle: 'alice.bsky.social', atprotoAppPassword: 'app-pw', ...overrides });

const atprotoPeer = (overrides = {}) =>
  userRemote({ atprotoDid: 'did:plc:bob', atprotoHandle: 'bob.bsky.social', ...overrides });

const feedPost = (overrides = {}) => ({
  post: {
    uri: 'at://did:plc:bob/app.bsky.feed.post/abc',
    cid: 'bafy',
    author: { handle: 'bob.bsky.social', displayName: 'Bob B', avatar: 'https://cdn/av.jpg', did: 'did:plc:bob' },
    record: { text: 'hello world', createdAt: '2026-08-20T00:00:00.000Z' },
    replyCount: 2,
    ...overrides,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  agentMock.session = undefined;
  agentMock.login.mockImplementation(async () => {
    agentMock.session = { did: 'did:plc:alice' };
    return { data: { did: 'did:plc:alice', handle: 'alice.bsky.social', refreshJwt: 'rjwt' } };
  });
  db.getRemoteContent.mockResolvedValue(null);
  db.saveRemoteContent.mockResolvedValue(undefined);
  prismaMock.default.content.findFirst.mockResolvedValue(null);
});

describe('credential gating', () => {
  it('knows when an account is linked', () => {
    expect(hasBlueskyCredentials(linked())).toBe(true);
    expect(hasBlueskyCredentials(user())).toBe(false);
  });

  it('recognizes a peer followed over atproto', () => {
    expect(isAtprotoUserRemote(atprotoPeer())).toBe(true);
    expect(isAtprotoUserRemote(userRemote())).toBe(false);
  });

  it('returns no agent for an unlinked user', async () => {
    await expect(getAgent(user())).resolves.toBeNull();
  });
});

describe('getAgent', () => {
  it('resumes a stored session rather than logging in again', async () => {
    agentMock.resumeSession.mockImplementation(async () => {
      agentMock.session = { did: 'did:plc:alice' };
    });

    await getAgent(linked({ atprotoDid: 'did:plc:alice', atprotoRefreshJwt: 'rjwt' }));

    expect(agentMock.resumeSession).toHaveBeenCalled();
    expect(agentMock.login).not.toHaveBeenCalled();
  });

  it('falls back to the app password when the stored session is dead', async () => {
    agentMock.resumeSession.mockRejectedValue(new Error('expired'));

    await getAgent(linked({ atprotoDid: 'did:plc:alice', atprotoRefreshJwt: 'stale' }));

    expect(agentMock.login).toHaveBeenCalledWith({ identifier: 'alice.bsky.social', password: 'app-pw' });
  });

  it('returns null rather than throwing when the credentials are wrong', async () => {
    agentMock.login.mockRejectedValue(new Error('bad password'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(getAgent(linked())).resolves.toBeNull();
  });
});

describe('publishToBluesky', () => {
  it('mirrors the post and records where it landed', async () => {
    agentMock.com.atproto.repo.putRecord.mockResolvedValue({
      data: { uri: 'at://did:plc:alice/app.bsky.feed.post/hello', cid: 'bafyrei' },
    });

    await publishToBluesky(HOST, linked(), content());

    expect(agentMock.com.atproto.repo.putRecord).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'app.bsky.feed.post', rkey: rkeyFor(content()) })
    );
    expect(prismaMock.default.content.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { atprotoUri: 'at://did:plc:alice/app.bsky.feed.post/hello', atprotoCid: 'bafyrei' },
    });
  });

  it('uses putRecord so republishing an edit replaces rather than duplicates', async () => {
    agentMock.com.atproto.repo.putRecord.mockResolvedValue({ data: { uri: 'at://x', cid: 'y' } });

    await publishToBluesky(HOST, linked(), content());
    await publishToBluesky(HOST, linked(), content());

    const rkeys = agentMock.com.atproto.repo.putRecord.mock.calls.map(([args]) => args.rkey);
    // Same post, same TID: an edit replaces the record instead of duplicating.
    expect(rkeys).toEqual([rkeyFor(content()), rkeyFor(content())]);
  });

  it('never mirrors hidden content', async () => {
    await publishToBluesky(HOST, linked(), content({ hidden: true }));

    expect(agentMock.com.atproto.repo.putRecord).not.toHaveBeenCalled();
  });

  it('does nothing for a user with no linked account', async () => {
    await publishToBluesky(HOST, user(), content());

    expect(agentMock.login).not.toHaveBeenCalled();
  });

  it('does not fail the local publish when Bluesky rejects the post', async () => {
    agentMock.com.atproto.repo.putRecord.mockRejectedValue(new Error('rate limited'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(publishToBluesky(HOST, linked(), content())).resolves.toBeUndefined();
    expect(prismaMock.default.content.update).not.toHaveBeenCalled();
  });
});

describe('deleteFromBluesky', () => {
  it('deletes the mirrored record by its rkey', async () => {
    await deleteFromBluesky(linked(), content({ atprotoUri: 'at://did:plc:alice/app.bsky.feed.post/hello' }));

    expect(agentMock.com.atproto.repo.deleteRecord).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'app.bsky.feed.post', rkey: 'hello' })
    );
  });

  it('does nothing for a post that was never mirrored', async () => {
    await deleteFromBluesky(linked(), content());

    expect(agentMock.com.atproto.repo.deleteRecord).not.toHaveBeenCalled();
  });
});

describe('followOnBluesky', () => {
  it('creates a real follow when the local user has credentials', async () => {
    await followOnBluesky(linked(), atprotoPeer());

    expect(agentMock.follow).toHaveBeenCalledWith('did:plc:bob');
  });

  it('stays local-only when the user has not linked an account', async () => {
    await followOnBluesky(user(), atprotoPeer());

    expect(agentMock.follow).not.toHaveBeenCalled();
  });
});

describe('mapAtprotoFeedIntoDb', () => {
  it('stores a post as ContentRemote the reader can render', async () => {
    await mapAtprotoFeedIntoDb(atprotoPeer(), [feedPost()]);

    expect(db.saveRemoteContent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'post',
        postId: 'at://did:plc:bob/app.bsky.feed.post/abc',
        link: 'https://bsky.app/profile/bob.bsky.social/post/abc',
        username: 'bob.bsky.social',
        creator: 'Bob B',
        commentsCount: 2,
        view: '<p>hello world</p>',
      })
    );
  });

  it('skips posts older than the 30-day window, matching the Atom reader', async () => {
    await mapAtprotoFeedIntoDb(atprotoPeer(), [
      feedPost({ record: { text: 'ancient', createdAt: '2020-01-01T00:00:00.000Z' } }),
    ]);

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });

  it('skips a post it already has at the same timestamp', async () => {
    db.getRemoteContent.mockResolvedValue({ id: 7, updatedAt: new Date('2026-08-20T00:00:00.000Z') });

    await mapAtprotoFeedIntoDb(atprotoPeer(), [feedPost()]);

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });

  it('updates a post whose timestamp moved, reusing the existing row', async () => {
    db.getRemoteContent.mockResolvedValue({ id: 7, updatedAt: new Date('2026-08-19T00:00:00.000Z') });

    await mapAtprotoFeedIntoDb(atprotoPeer(), [feedPost()]);

    expect(db.saveRemoteContent).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });

  it('never overwrites a row that became a comment', async () => {
    db.getRemoteContent.mockResolvedValue({ id: 7, type: 'comment', updatedAt: new Date(0) });

    await mapAtprotoFeedIntoDb(atprotoPeer(), [feedPost()]);

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });

  it('records the parent uri for a reply', async () => {
    await mapAtprotoFeedIntoDb(atprotoPeer(), [
      feedPost({
        record: {
          text: 'agreed',
          createdAt: '2026-08-20T00:00:00.000Z',
          reply: { parent: { uri: 'at://did:plc:carol/app.bsky.feed.post/xyz' } },
        },
      }),
    ]);

    expect(db.saveRemoteContent).toHaveBeenCalledWith(
      expect.objectContaining({ thread: 'at://did:plc:carol/app.bsky.feed.post/xyz' })
    );
  });

  it('ignores malformed entries without failing the batch', async () => {
    await mapAtprotoFeedIntoDb(atprotoPeer(), [{}, { post: { uri: 'at://x' } }, feedPost()]);

    expect(db.saveRemoteContent).toHaveBeenCalledTimes(1);
  });

  it('keeps going when one insert fails', async () => {
    db.saveRemoteContent.mockRejectedValueOnce(new Error('unique violation'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      mapAtprotoFeedIntoDb(atprotoPeer(), [feedPost(), feedPost({ uri: 'at://did:plc:bob/app.bsky.feed.post/def' })])
    ).resolves.toBeUndefined();
    expect(db.saveRemoteContent).toHaveBeenCalledTimes(2);
  });
});

describe('inbound reader quality', () => {
  it('renders a post embed alongside its text', async () => {
    await mapAtprotoFeedIntoDb(atprotoPeer(), [
      feedPost({
        record: { text: 'look', createdAt: '2026-08-20T00:00:00.000Z' },
        embed: { $type: 'app.bsky.embed.images#view', images: [{ thumb: 'https://cdn/t.jpg', alt: 'cat' }] },
      }),
    ]);

    const saved = db.saveRemoteContent.mock.calls[0][0];
    expect(saved.view).toContain('<p>look</p>');
    expect(saved.view).toContain('https://cdn/t.jpg');
  });

  it('attributes a repost to whoever wrote it, and notes who boosted', async () => {
    await mapAtprotoFeedIntoDb(atprotoPeer(), [
      {
        post: {
          uri: 'at://did:plc:carol/app.bsky.feed.post/xyz',
          author: { handle: 'carol.bsky.social', displayName: 'Carol C' },
          record: { text: 'carol wrote this', createdAt: '2026-08-20T00:00:00.000Z' },
        },
        reason: { $type: 'app.bsky.feed.defs#reasonRepost', by: { handle: 'bob.bsky.social', displayName: 'Bob B' } },
      },
    ]);

    const saved = db.saveRemoteContent.mock.calls[0][0];
    // The post belongs to Carol even though Bob is the one we follow.
    expect(saved.username).toBe('carol.bsky.social');
    expect(saved.creator).toBe('Carol C');
    expect(saved.title).toBe('Bob B reposted');
  });

  it('files a reply to one of our own posts as a comment on it', async () => {
    prismaMock.default.content.findFirst.mockResolvedValue({ name: 'hello' });

    await mapAtprotoFeedIntoDb(atprotoPeer(), [
      feedPost({
        record: {
          text: 'nice post',
          createdAt: '2026-08-20T00:00:00.000Z',
          reply: { parent: { uri: 'at://did:plc:alice/app.bsky.feed.post/hello' } },
        },
      }),
    ]);

    const saved = db.saveRemoteContent.mock.calls[0][0];
    expect(saved.type).toBe('comment');
    expect(saved.localContentName).toBe('hello');
  });

  it('keeps a reply to someone else as a plain post', async () => {
    prismaMock.default.content.findFirst.mockResolvedValue(null);

    await mapAtprotoFeedIntoDb(atprotoPeer(), [
      feedPost({
        record: {
          text: 'unrelated',
          createdAt: '2026-08-20T00:00:00.000Z',
          reply: { parent: { uri: 'at://did:plc:dave/app.bsky.feed.post/zzz' } },
        },
      }),
    ]);

    const saved = db.saveRemoteContent.mock.calls[0][0];
    expect(saved.type).toBe('post');
    expect(saved.localContentName).toBeNull();
  });
});

describe('likes and reposts', () => {
  beforeEach(() => {
    agentMock.app.bsky.feed.getPosts.mockResolvedValue({
      data: { posts: [{ uri: 'at://did:plc:bob/app.bsky.feed.post/abc', cid: 'bafy', viewer: {} }] },
    });
  });

  it('likes a post by its uri and cid', async () => {
    await likeOnBluesky(linked(), 'at://did:plc:bob/app.bsky.feed.post/abc', true);

    expect(agentMock.like).toHaveBeenCalledWith('at://did:plc:bob/app.bsky.feed.post/abc', 'bafy');
  });

  it('unlikes via the like record on the viewer state', async () => {
    agentMock.app.bsky.feed.getPosts.mockResolvedValue({
      data: { posts: [{ uri: 'at://x', cid: 'bafy', viewer: { like: 'at://did:plc:alice/app.bsky.feed.like/1' } }] },
    });

    await likeOnBluesky(linked(), 'at://did:plc:bob/app.bsky.feed.post/abc', false);

    expect(agentMock.deleteLike).toHaveBeenCalledWith('at://did:plc:alice/app.bsky.feed.like/1');
  });

  it('reposts a post', async () => {
    await repostOnBluesky(linked(), 'at://did:plc:bob/app.bsky.feed.post/abc', true);

    expect(agentMock.repost).toHaveBeenCalledWith('at://did:plc:bob/app.bsky.feed.post/abc', 'bafy');
  });

  it('ignores a non-atproto uri, which belongs to the ActivityPub path', async () => {
    await likeOnBluesky(linked(), 'https://mastodon.social/@bob/1', true);
    await repostOnBluesky(linked(), 'https://mastodon.social/@bob/1', true);

    expect(agentMock.like).not.toHaveBeenCalled();
    expect(agentMock.repost).not.toHaveBeenCalled();
  });
});
