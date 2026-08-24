import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  getLocalContent: vi.fn(),
  getRemoteContent: vi.fn(),
  getRemoteUser: vi.fn(),
  getRemoteUserByActor: vi.fn(),
  removeRemoteContent: vi.fn(),
  removeRemoteUser: vi.fn(),
  saveRemoteContent: vi.fn(),
  saveRemoteUser: vi.fn(),
}));
const discover = vi.hoisted(() => ({
  getActivityPubActor: vi.fn(),
  getUserRemoteInfo: vi.fn(),
}));

vi.mock('server/social/db', () => db);
vi.mock('server/social/discover-user', () => discover);

import {
  accept,
  createArticle,
  createGenericMessage,
  findUserRemote,
  follow,
  handle,
  like,
  reply,
  salmonSend,
} from 'server/social/activitystreams';
import { HOST, content, contentRemote, keys, user, userRemote } from './fixtures';

const ACTOR = `https://${HOST}/api/social/activitypub/actor?resource=https%3A%2F%2F${HOST}%2Falice`;
const PUBLIC = 'https://www.w3.org/ns/activitystreams#Public';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 202 }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// send() is fire-and-forget; give the microtask queue a turn to flush it.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function lastBody() {
  return JSON.parse(fetchMock.mock.calls.at(-1)![1].body);
}

describe('createGenericMessage', () => {
  it('builds an addressed activity pointing back at the local actor', () => {
    const message = createGenericMessage('Follow', HOST, 'https://example.com/id', user(), 'https://remote/bob');

    expect(message).toEqual({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Follow',
      id: 'https://example.com/id',
      actor: ACTOR,
      to: [PUBLIC],
      cc: undefined,
      object: 'https://remote/bob',
    });
  });

  it('ccs the supplied followers', () => {
    const message = createGenericMessage('Create', HOST, 'id', user(), 'o', [
      userRemote({ profileUrl: 'https://a/1' }),
      userRemote({ profileUrl: 'https://b/2' }),
    ]);

    expect(message.cc).toEqual(['https://a/1', 'https://b/2']);
  });
});

describe('createArticle', () => {
  const localContent = content();

  it('wraps an Article object in a Create activity', async () => {
    const message = await createArticle(HOST, localContent, user());

    expect(message.type).toBe('Create');
    expect(message.actor).toBe(ACTOR);
    expect(message.object).toMatchObject({
      type: 'Article',
      id: `https://${HOST}/api/social/activitypub/message?resource=https%3A%2F%2F${HOST}%2Falice%2Fblog%2Fhello`,
      url: `https://${HOST}/alice/blog/hello`,
      attributedTo: ACTOR,
      title: 'Hello',
      published: '2026-02-01T00:00:00.000Z',
      updated: '2026-02-02T00:00:00.000Z',
      to: PUBLIC,
    });
    expect(message.id).toBe((message.object as { id: string }).id);
  });

  it('absolutizes /resource urls and appends the stats pixel to the content', async () => {
    const message = await createArticle(HOST, content({ view: '<img src="/resource/a.jpg" />' }), user());
    const html = (message.object as { content: string }).content;

    expect(html).toContain(`src="https://${HOST}/resource/a.jpg"`);
    expect(html).toContain(`<img src="https://${HOST}/api/stats?resource=`);
  });

  it('leaves inReplyTo empty for a top-level post', async () => {
    const message = await createArticle(HOST, localContent, user());

    expect((message.object as { inReplyTo: string }).inReplyTo).toBe('');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves a thread url to the remote activity id', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'https://remote.example/notes/99' }), {
        status: 200,
        headers: { 'content-type': 'application/activity+json' },
      })
    );

    const message = await createArticle(HOST, content({ thread: 'https://remote.example/@bob/99' }), user());

    expect((message.object as { inReplyTo: string }).inReplyTo).toBe('https://remote.example/notes/99');
  });

  it('falls back to the raw thread url when the remote object cannot be fetched', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    const message = await createArticle(HOST, content({ thread: 'https://remote.example/@bob/99' }), user());

    expect((message.object as { inReplyTo: string }).inReplyTo).toBe('https://remote.example/@bob/99');
  });
});

describe('delivery', () => {
  const inbox = 'https://remote.example/users/bob/inbox';
  const owner = () => user({ privateKey: keys().privateKeyPkcs1 });

  it('prefers the ActivityPub inbox and signs the request', async () => {
    await follow(HOST, owner(), userRemote({ activityPubInboxUrl: inbox }), true);
    await flush();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(inbox);
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/ld+json');
    expect(init.headers.Host).toBe('remote.example');
    expect(init.headers.Date).toBeTruthy();
    expect(init.headers.Signature).toContain(`keyId="${ACTOR}"`);
    expect(init.headers.Signature).toContain('headers="(request-target) host date"');
  });

  it('produces a signature the receiver can verify over request-target, host and date', async () => {
    await follow(HOST, owner(), userRemote({ activityPubInboxUrl: inbox }), true);
    await flush();

    const { headers } = fetchMock.mock.calls[0][1];
    const signature = headers.Signature.match(/signature="([^"]+)"/)![1];
    const signed = `(request-target): post /users/bob/inbox\nhost: remote.example\ndate: ${headers.Date}`;

    const verifier = crypto.createVerify('sha256');
    verifier.update(signed);
    verifier.end();
    expect(verifier.verify(keys().publicKey, signature, 'base64')).toBe(true);
  });

  it('falls back to salmon when there is no inbox', async () => {
    await follow(
      HOST,
      owner(),
      userRemote({ activityPubInboxUrl: null, salmonUrl: 'https://remote.example/salmon' }),
      true
    );
    await flush();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://remote.example/salmon');
    expect(init.headers['Content-Type']).toBe('application/magic-envelope+json');
  });

  it('sends nothing when the remote user exposes neither an inbox nor salmon', async () => {
    await follow(HOST, owner(), userRemote({ activityPubInboxUrl: null, salmonUrl: null }), true);
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('swallows delivery failures so a dead peer cannot break the caller', async () => {
    fetchMock.mockRejectedValue(new Error('connection refused'));

    await expect(follow(HOST, owner(), userRemote({ activityPubInboxUrl: inbox }), true)).resolves.toBeUndefined();
    await flush();
  });

  it('signs a salmon envelope with base64url values the peer can verify', async () => {
    const remote = userRemote({ activityPubInboxUrl: null, salmonUrl: 'https://remote.example/salmon' });
    const message = createGenericMessage('Follow', HOST, 'id', owner(), 'https://remote.example/bob');

    await salmonSend(remote, owner(), message);

    const envelope = lastBody();
    expect(envelope).toMatchObject({ data_type: 'application/ld+json', alg: 'RSA-SHA256', encoding: 'base64url' });
    expect(JSON.parse(Buffer.from(envelope.data, 'base64url').toString('utf8'))).toEqual(message);

    const magic = (await import('magic-signatures')).default;
    expect(() => magic.verify(envelope, keys().publicKey)).not.toThrow();
  });
});

describe('outbound activities', () => {
  const remote = () => userRemote({ activityPubInboxUrl: 'https://remote.example/inbox' });
  const owner = () => user({ privateKey: keys().privateKeyPkcs1 });

  it('sends Follow with the remote profile as object', async () => {
    await follow(HOST, owner(), remote(), true);
    await flush();

    expect(lastBody()).toMatchObject({ type: 'Follow', object: 'https://remote.example/bob', actor: ACTOR });
  });

  it('wraps the Follow in an Undo when unfollowing', async () => {
    await follow(HOST, owner(), remote(), false);
    await flush();

    const body = lastBody();
    expect(body.type).toBe('Undo');
    expect(body.object).toMatchObject({ type: 'Follow', object: 'https://remote.example/bob' });
    expect(body.id).toContain('/api/social/activitypub/undo');
  });

  it('sends Like with the remote post as object', async () => {
    await like(HOST, owner(), contentRemote({ link: 'https://remote.example/p/1', title: 'A post' }), remote(), true);
    await flush();

    expect(lastBody()).toMatchObject({
      type: 'Like',
      object: {
        type: 'Post',
        id: 'https://remote.example/p/1',
        displayName: 'A post',
        url: 'https://remote.example/p/1',
      },
    });
  });

  it('sends Accept echoing the original body', async () => {
    await accept(HOST, owner(), remote(), '{"type":"Follow"}');
    await flush();

    expect(lastBody()).toMatchObject({ type: 'Accept', object: '{"type":"Follow"}' });
  });

  it('sends a reply as a Create carrying the article', async () => {
    await reply(HOST, owner(), content(), remote(), []);
    await flush();

    expect(lastBody()).toMatchObject({ type: 'Create', object: { type: 'Article', title: 'Hello' } });
  });
});

describe('findUserRemote', () => {
  it('returns the known remote user for the actor', async () => {
    const known = userRemote();
    db.getRemoteUserByActor.mockResolvedValue(known);

    await expect(findUserRemote({ actor: 'https://remote.example/users/bob' }, user())).resolves.toBe(known);
    expect(db.getRemoteUserByActor).toHaveBeenCalledWith('alice', 'https://remote.example/users/bob');
    expect(discover.getActivityPubActor).not.toHaveBeenCalled();
  });

  it('discovers and saves an unknown actor, then re-reads it', async () => {
    const discovered = userRemote({ id: -1 });
    const saved = userRemote({ id: 12 });
    db.getRemoteUserByActor.mockResolvedValue(null);
    discover.getActivityPubActor.mockResolvedValue({ url: 'https://remote.example/bob' });
    discover.getUserRemoteInfo.mockResolvedValue(discovered);
    db.getRemoteUser.mockResolvedValue(saved);

    await expect(findUserRemote({ actor: 'https://remote.example/users/bob' }, user())).resolves.toBe(saved);

    expect(discover.getUserRemoteInfo).toHaveBeenCalledWith('https://remote.example/bob', 'alice');
    expect(db.saveRemoteUser).toHaveBeenCalledWith(discovered);
    expect(db.getRemoteUser).toHaveBeenCalledWith('alice', 'https://remote.example/bob');
  });

  it('returns null when the actor document has no profile url', async () => {
    db.getRemoteUserByActor.mockResolvedValue(null);
    discover.getActivityPubActor.mockResolvedValue({ id: 'x' });

    await expect(findUserRemote({ actor: 'https://remote.example/users/bob' }, user())).resolves.toBeNull();
    expect(db.saveRemoteUser).not.toHaveBeenCalled();
  });
});

describe('handle', () => {
  const activity = (type: string, object: unknown = {}) => ({ type, object, id: 'x', actor: 'a', to: [] }) as never;

  it.each(['Accept', 'Announce', 'Delete', 'Undo', ''])('ignores unhandled activity type %s', async (type) => {
    await handle(type, HOST, activity(type), user(), userRemote());

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
    expect(db.saveRemoteUser).not.toHaveBeenCalled();
    expect(db.removeRemoteUser).not.toHaveBeenCalled();
  });

  it('marks the remote user a follower on Follow', async () => {
    await handle('Follow', HOST, activity('Follow'), user(), userRemote({ follower: false }));

    expect(db.saveRemoteUser).toHaveBeenCalledWith(expect.objectContaining({ follower: true, id: 5 }));
  });

  describe('Create', () => {
    const object = {
      id: 'https://remote.example/notes/1',
      type: 'Note',
      content: '<p>hi <script>alert(1)</script></p>',
      title: 'A note',
      published: '2026-04-01T00:00:00.000Z',
      updated: '2026-04-02T00:00:00.000Z',
      repliesCount: '4',
      repliesUpdated: '2026-04-03T00:00:00.000Z',
    };

    it('stores a top-level post attributed to the remote user', async () => {
      db.getRemoteContent.mockResolvedValue(null);

      await handle('Create', HOST, activity('Create', object), user(), userRemote());

      const saved = db.saveRemoteContent.mock.calls[0][0];
      expect(saved).toMatchObject({
        type: 'post',
        id: -1,
        toUsername: 'alice',
        fromUsername: 'https://remote.example/bob',
        fromUserRemoteId: '5',
        creator: 'Bob B',
        username: 'bob',
        link: object.id,
        postId: object.id,
        title: 'A note',
        commentsCount: 4,
      });
      expect(saved.createdAt).toEqual(new Date(object.published));
      expect(saved.updatedAt).toEqual(new Date(object.updated));
    });

    it('sanitizes remote html before storing it', async () => {
      db.getRemoteContent.mockResolvedValue(null);

      await handle('Create', HOST, activity('Create', object), user(), userRemote());

      expect(db.saveRemoteContent.mock.calls[0][0].view).toBe('<p>hi </p>');
    });

    it('reuses the existing row id so an edit updates instead of duplicating', async () => {
      db.getRemoteContent.mockResolvedValue(contentRemote({ id: 77 }));

      await handle('Create', HOST, activity('Create', object), user(), userRemote());

      expect(db.getRemoteContent).toHaveBeenCalledWith('alice', object.id);
      expect(db.saveRemoteContent.mock.calls[0][0].id).toBe(77);
    });

    it('defaults a missing replies count to zero', async () => {
      db.getRemoteContent.mockResolvedValue(null);

      await handle('Create', HOST, activity('Create', { ...object, repliesCount: undefined }), user(), userRemote());

      expect(db.saveRemoteContent.mock.calls[0][0].commentsCount).toBe(0);
    });

    it('files a reply as a comment on the local item it answers', async () => {
      db.getRemoteContent.mockResolvedValue(null);
      db.getLocalContent.mockResolvedValue(content({ name: 'hello' }));

      const replyObject = { ...object, inReplyTo: `https://${HOST}/alice/blog/hello` };
      await handle('Create', HOST, activity('Create', replyObject), user(), userRemote());

      expect(db.getLocalContent).toHaveBeenCalledWith(replyObject.inReplyTo);
      expect(db.saveRemoteContent.mock.calls[0][0]).toMatchObject({ type: 'comment', localContentName: 'hello' });
    });

    it('drops a reply to a local item that does not exist', async () => {
      db.getRemoteContent.mockResolvedValue(null);
      db.getLocalContent.mockResolvedValue(null);

      await handle('Create', HOST, activity('Create', { ...object, inReplyTo: 'https://x/y/z' }), user(), userRemote());

      expect(db.saveRemoteContent).not.toHaveBeenCalled();
    });
  });

  describe('Like', () => {
    const liked = { id: 'l', url: 'u', type: 'Post', inReplyTo: `https://${HOST}/alice/blog/hello` };

    it('records a favorite against the local item', async () => {
      db.getLocalContent.mockResolvedValue(content({ username: 'alice', name: 'hello' }));
      db.getRemoteContent.mockResolvedValue(null);

      await handle('Like', HOST, activity('Like', liked), user(), userRemote());

      expect(db.saveRemoteContent.mock.calls[0][0]).toMatchObject({
        type: 'favorite',
        toUsername: 'alice',
        localContentName: 'hello',
        fromUsername: 'https://remote.example/bob',
        username: 'bob',
        link: '',
        title: '',
        view: '',
      });
    });

    it('is idempotent: a repeat Like from the same user stores nothing new', async () => {
      db.getLocalContent.mockResolvedValue(content());
      db.getRemoteContent.mockResolvedValue(contentRemote({ type: 'favorite' }));

      await handle('Like', HOST, activity('Like', liked), user(), userRemote());

      expect(db.saveRemoteContent).not.toHaveBeenCalled();
    });

    it('ignores a Like on an item we do not have', async () => {
      db.getLocalContent.mockResolvedValue(null);

      await handle('Like', HOST, activity('Like', liked), user(), userRemote());

      expect(db.saveRemoteContent).not.toHaveBeenCalled();
      expect(db.getRemoteContent).not.toHaveBeenCalled();
    });
  });
});
