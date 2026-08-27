import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  ensureEd25519Key: vi.fn(),
  getLocalContent: vi.fn(),
  getLocalUserByUsername: vi.fn(),
  getRemoteContent: vi.fn(),
  getRemoteUser: vi.fn(),
  getRemoteUserByActor: vi.fn(),
  removeRemoteContent: vi.fn(),
  removeRemoteContentByPostId: vi.fn(),
  removeRemoteUser: vi.fn(),
  saveRemoteContent: vi.fn(),
  saveRemoteUser: vi.fn(),
}));
const discover = vi.hoisted(() => ({
  getActivityPubActor: vi.fn(),
  getUserRemoteInfo: vi.fn(),
}));
const queue = vi.hoisted(() => ({
  MAX_ATTEMPTS: 10,
  backoffMs: vi.fn(() => 1000),
  dropDelivery: vi.fn(),
  dueDeliveries: vi.fn(async () => []),
  enqueueDelivery: vi.fn(),
  isGone: (status: number) => status === 410,
  isPermanentFailure: (status: number) => status !== 408 && status !== 429 && status >= 400 && status < 500,
  pruneExhaustedDeliveries: vi.fn(async () => 0),
  rescheduleDelivery: vi.fn(),
  retireInbox: vi.fn(),
}));

vi.mock('server/social/db', () => db);
vi.mock('server/social/discover-user', () => discover);
vi.mock('server/social/delivery-queue', () => queue);

import {
  accept,
  createNote,
  createGenericMessage,
  deliver,
  findHashtags,
  findUserRemote,
  follow,
  handle,
  isSameOrigin,
  like,
  refreshRemoteKey,
  runDeliveryQueue,
  salmonSend,
} from 'server/social/activitystreams';
import { verifyIntegrityProof } from 'server/social/integrity-proof';
import { HOST, content, contentRemote, keys, proofKeys, user, userRemote } from './fixtures';

const ACTOR = `https://${HOST}/ap/alice`;
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

describe('createNote', () => {
  const localContent = content();

  it('wraps a Note object in a Create activity', async () => {
    const message = await createNote(HOST, localContent, user());

    expect(message.type).toBe('Create');
    expect(message.actor).toBe(ACTOR);
    expect(message.object).toMatchObject({
      // Note, not Article: Mastodon renders Article inconsistently.
      type: 'Note',
      id: `https://${HOST}/ap/alice/o/hello`,
      url: `https://${HOST}/alice/blog/hello`,
      attributedTo: ACTOR,
      title: 'Hello',
      published: '2026-02-01T00:00:00.000Z',
      updated: '2026-02-02T00:00:00.000Z',
      to: [PUBLIC],
      cc: [`https://${HOST}/ap/alice/followers`],
    });
    expect(message.id).toBe((message.object as { id: string }).id);
  });

  it('points the Note at its replies collection, hung off the objects own url', async () => {
    const message = await createNote(HOST, localContent, user());

    const repliesUrl = `https://${HOST}/ap/alice/o/hello/replies`;
    expect((message.object as { replies: unknown }).replies).toEqual({
      id: repliesUrl,
      type: 'OrderedCollection',
      totalItems: 0,
      updated: undefined,
      first: `${repliesUrl}?page=1`,
    });
  });

  it('inlines the reply count it was handed, so peers render a thread without a fetch', async () => {
    const message = await createNote(HOST, localContent, user(), undefined, {
      count: 4,
      updated: new Date('2026-03-01T00:00:00.000Z'),
    });

    expect((message.object as { replies: { totalItems: number; updated: string } }).replies).toMatchObject({
      totalItems: 4,
      updated: '2026-03-01T00:00:00.000Z',
    });
  });

  it('leads the content with the linked title, since a Note has no rendered name', () => {
    return createNote(HOST, localContent, user()).then((message) => {
      expect((message.object as { content: string }).content).toContain(
        `<p><a href="https://${HOST}/alice/blog/hello"><strong>Hello</strong></a></p>`
      );
    });
  });

  // Mastodon renders any summary as a content warning, so an unconditional one
  // would collapse every post on the site behind a "show more".
  it('sets no summary on a post that carries no content warning', async () => {
    const message = await createNote(HOST, localContent, user());

    expect((message.object as { summary?: string }).summary).toBeUndefined();
    expect((message.object as { sensitive?: boolean }).sensitive).toBeUndefined();
  });

  it('emits the content warning as summary, and marks the post sensitive', async () => {
    const message = await createNote(HOST, content({ contentWarning: 'spoilers' }), user());

    expect(message.object).toMatchObject({ summary: 'spoilers', sensitive: true });
  });

  it('marks a post sensitive without a summary when the flag is set on its own', async () => {
    const message = await createNote(HOST, content({ sensitive: true }), user());

    expect((message.object as { sensitive?: boolean }).sensitive).toBe(true);
    expect((message.object as { summary?: string }).summary).toBeUndefined();
  });

  it('attaches the thumbnail with the metadata clients need to render it', async () => {
    const withThumb = await createNote(HOST, content({ thumb: '/resource/thumb.jpg' }), user());
    expect((withThumb.object as { attachment: unknown[] }).attachment).toEqual([
      {
        type: 'Image',
        mediaType: 'image/jpeg',
        url: `https://${HOST}/resource/thumb.jpg`,
        name: 'Hello',
        width: 154,
        height: 154,
      },
    ]);

    const png = await createNote(HOST, content({ thumb: '/resource/thumb.PNG' }), user());
    expect((png.object as { attachment: { mediaType: string }[] }).attachment[0].mediaType).toBe('image/png');

    const without = await createNote(HOST, localContent, user());
    expect((without.object as { attachment?: unknown[] }).attachment).toBeUndefined();
  });

  it('omits the title heading on a comment, which has no title of its own', async () => {
    const message = await createNote(HOST, content({ section: 'comments', view: '<p>nice</p>' }), user());

    expect((message.object as { content: string }).content).toBe(
      `<p>nice</p><img src="https://${HOST}/api/stats?resource=${encodeURIComponent(`https://${HOST}/alice/comments/hello`)}" />`
    );
  });

  it('absolutizes /resource urls and appends the stats pixel to the content', async () => {
    const message = await createNote(HOST, content({ view: '<img src="/resource/a.jpg" />' }), user());
    const html = (message.object as { content: string }).content;

    expect(html).toContain(`src="https://${HOST}/resource/a.jpg"`);
    expect(html).toContain(`<img src="https://${HOST}/api/stats?resource=`);
  });

  it('leaves inReplyTo empty for a top-level post', async () => {
    const message = await createNote(HOST, localContent, user());

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

    const message = await createNote(HOST, content({ thread: 'https://remote.example/@bob/99' }), user());

    expect((message.object as { inReplyTo: string }).inReplyTo).toBe('https://remote.example/notes/99');
  });

  it('falls back to the raw thread url when the remote object cannot be fetched', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    const message = await createNote(HOST, content({ thread: 'https://remote.example/@bob/99' }), user());

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
    expect(init.headers['Content-Type']).toBe('application/activity+json');
    expect(init.headers.Host).toBe('remote.example');
    expect(init.headers.Date).toBeTruthy();
    // The fragment has to match the actor document's publicKey.id.
    expect(init.headers.Signature).toContain(`keyId="${ACTOR}#main-key"`);
    expect(init.headers.Signature).toContain('headers="(request-target) host date digest content-type"');
  });

  it('sends a Digest header matching the body exactly', async () => {
    await follow(HOST, owner(), userRemote({ activityPubInboxUrl: inbox }), true);
    await flush();

    const [, init] = fetchMock.mock.calls[0];
    const expected = crypto.createHash('sha256').update(init.body, 'utf8').digest('base64');
    expect(init.headers.Digest).toBe(`SHA-256=${expected}`);
  });

  it('delivers to the shared inbox when the peer advertises one', async () => {
    // Several followers on one instance otherwise get N copies of the same post.
    const shared = 'https://remote.example/inbox';
    await follow(HOST, owner(), userRemote({ activityPubInboxUrl: inbox, sharedInboxUrl: shared }), true);
    await flush();

    expect(fetchMock.mock.calls[0][0]).toBe(shared);
  });

  it('produces a signature the receiver can verify, covering the body via the digest', async () => {
    await follow(HOST, owner(), userRemote({ activityPubInboxUrl: inbox }), true);
    await flush();

    const { headers } = fetchMock.mock.calls[0][1];
    const signature = headers.Signature.match(/signature="([^"]+)"/)![1];
    const signed = [
      '(request-target): post /users/bob/inbox',
      'host: remote.example',
      `date: ${headers.Date}`,
      `digest: ${headers.Digest}`,
      'content-type: application/activity+json',
    ].join('\n');

    const verifier = crypto.createVerify('sha256');
    verifier.update(signed);
    verifier.end();
    expect(verifier.verify(keys().publicKey, signature, 'base64')).toBe(true);
  });

  describe('object integrity proofs', () => {
    // The signed owner: RSA for the request, Ed25519 for the activity itself.
    const proofOwner = () => user({ privateKey: keys().privateKeyPkcs1, ed25519PrivateKey: proofKeys().privateKeyPem });

    it('attaches a FEP-8b32 proof to what it delivers', async () => {
      await follow(HOST, proofOwner(), userRemote({ activityPubInboxUrl: inbox }), true);
      await flush();

      expect(lastBody().proof).toMatchObject({
        type: 'DataIntegrityProof',
        cryptosuite: 'eddsa-jcs-2022',
        proofPurpose: 'assertionMethod',
        verificationMethod: `${ACTOR}#ed25519-key`,
      });
    });

    it('produces a proof the receiver can verify off the wire', async () => {
      await follow(HOST, proofOwner(), userRemote({ activityPubInboxUrl: inbox }), true);
      await flush();

      expect(verifyIntegrityProof(lastBody(), proofKeys().publicKeyMultibase)).toBe(true);
    });

    it('declares the data integrity terms in @context so the proof is not dropped', async () => {
      await follow(HOST, proofOwner(), userRemote({ activityPubInboxUrl: inbox }), true);
      await flush();

      expect(lastBody()['@context']).toEqual([
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/data-integrity/v1',
        'https://w3id.org/security/multikey/v1',
      ]);
    });

    it('keeps the digest covering the proofed body, not the body before signing', async () => {
      await follow(HOST, proofOwner(), userRemote({ activityPubInboxUrl: inbox }), true);
      await flush();

      const [, init] = fetchMock.mock.calls.at(-1)!;
      const expected = crypto.createHash('sha256').update(init.body, 'utf8').digest('base64');
      expect(init.headers.Digest).toBe(`SHA-256=${expected}`);
      expect(JSON.parse(init.body).proof).toBeTruthy();
    });

    it('signs the whole fan-out once, so every inbox gets identical bytes', async () => {
      const recipients = [
        userRemote({ id: 1, profileUrl: 'https://one.example/bob', activityPubInboxUrl: 'https://one.example/inbox' }),
        userRemote({
          id: 2,
          profileUrl: 'https://two.example/carol',
          activityPubInboxUrl: 'https://two.example/inbox',
        }),
      ];
      const message = createGenericMessage('Delete', HOST, 'https://example.com/d/1', proofOwner(), 'https://x/1');

      await deliver(HOST, proofOwner(), recipients, message);
      await flush();

      const [first, second] = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body));
      expect(first.proof.proofValue).toBe(second.proof.proofValue);
      expect(verifyIntegrityProof(first, proofKeys().publicKeyMultibase)).toBe(true);
    });

    it('delivers unsigned for a user provisioned before proofs existed', async () => {
      // The HTTP signature still authenticates the hop; only forwarding is lost.
      await follow(HOST, owner(), userRemote({ activityPubInboxUrl: inbox }), true);
      await flush();

      expect(lastBody().proof).toBeUndefined();
      expect(fetchMock.mock.calls.at(-1)![1].headers.Signature).toContain('keyId=');
    });

    it('does not proof a salmon envelope, which predates all of this', async () => {
      await follow(HOST, proofOwner(), userRemote({ salmonUrl: 'https://remote.example/salmon' }), true);
      await flush();

      const envelope = lastBody();
      expect(envelope.sigs).toBeTruthy();
      expect(JSON.parse(Buffer.from(envelope.data, 'base64url').toString()).proof).toBeUndefined();
    });

    it('still delivers when the key cannot be decrypted', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await follow(
        HOST,
        user({ privateKey: keys().privateKeyPkcs1, ed25519PrivateKey: 'not-a-pem' }),
        userRemote({ activityPubInboxUrl: inbox }),
        true
      );
      await flush();

      expect(fetchMock).toHaveBeenCalledWith(inbox, expect.any(Object));
      expect(lastBody().proof).toBeUndefined();
    });
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
    expect(body.id).toContain(`https://${HOST}/ap/alice/a/`);
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

  it('sends Accept echoing the Follow activity itself', async () => {
    // The follower matches this object against its pending request; a
    // stringified body (what this used to send) matches nothing.
    const follow = {
      type: 'Follow',
      id: 'https://remote.example/follows/1',
      actor: 'https://remote.example/users/bob',
    };
    await accept(HOST, owner(), remote(), follow as never);
    await flush();

    expect(lastBody()).toMatchObject({ type: 'Accept', object: follow });
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
  // The actor is a real URI because the handlers now check that an activity's
  // object lives on the same origin as the actor sending it (FEP-fe34).
  const BOB = 'https://remote.example/users/bob';
  const activity = (type: string, object: unknown = {}, actor = BOB) =>
    ({ type, object, id: `${actor}#1`, actor, to: [] }) as never;

  it.each(['Add', 'Block', 'Flag', ''])('ignores unrecognized activity type %s', async (type) => {
    await handle(type, HOST, activity(type), user(), userRemote());

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
    expect(db.saveRemoteUser).not.toHaveBeenCalled();
    expect(db.removeRemoteUser).not.toHaveBeenCalled();
  });

  it('marks us following on Accept of our Follow', async () => {
    await handle('Accept', HOST, activity('Accept'), user(), userRemote({ following: false }));

    expect(db.saveRemoteUser).toHaveBeenCalledWith(expect.objectContaining({ following: true }));
  });

  it('drops a peer that Rejects our Follow, unless they follow us back', async () => {
    await handle('Reject', HOST, activity('Reject'), user(), userRemote({ follower: false }));
    expect(db.removeRemoteUser).toHaveBeenCalled();

    vi.clearAllMocks();
    await handle('Reject', HOST, activity('Reject'), user(), userRemote({ follower: true }));
    expect(db.removeRemoteUser).not.toHaveBeenCalled();
    expect(db.saveRemoteUser).toHaveBeenCalledWith(expect.objectContaining({ following: false }));
  });

  it('unfollows on Undo of a Follow', async () => {
    const remote = userRemote({ follower: true, following: false });
    await handle('Undo', HOST, activity('Undo', { type: 'Follow' }), user(), remote);

    // no reciprocal follow to preserve, so the row goes
    expect(db.removeRemoteUser).toHaveBeenCalledWith(remote);
  });

  it('unlikes on Undo of a Like', async () => {
    db.getLocalContent.mockResolvedValue(content());

    await handle(
      'Undo',
      HOST,
      activity('Undo', { type: 'Like', object: { inReplyTo: `https://${HOST}/alice/blog/hello` } }),
      user(),
      userRemote()
    );

    expect(db.removeRemoteContent).toHaveBeenCalledWith(expect.objectContaining({ type: 'favorite' }));
  });

  it('removes the peer when Delete names the actor itself', async () => {
    const remote = userRemote({ activityPubActorUrl: 'https://remote.example/users/bob' });
    await handle(
      'Delete',
      HOST,
      {
        type: 'Delete',
        id: 'x',
        actor: 'https://remote.example/users/bob',
        object: 'https://remote.example/users/bob',
        to: [],
      } as never,
      user(),
      remote
    );

    expect(db.removeRemoteUser).toHaveBeenCalledWith(remote);
  });

  it('removes just the post when Delete names one', async () => {
    await handle(
      'Delete',
      HOST,
      activity('Delete', { id: 'https://remote.example/notes/9', type: 'Tombstone' }),
      user(),
      userRemote()
    );

    expect(db.removeRemoteContentByPostId).toHaveBeenCalledWith('alice', 'https://remote.example/notes/9');
    expect(db.removeRemoteUser).not.toHaveBeenCalled();
  });

  // FEP-fe34. Verifying the signature says who sent the activity, not what they
  // may say with it — and every actor we have ever stored can reach this code.
  describe('origin checks', () => {
    it('refuses to delete a post that lives on another origin', async () => {
      await handle(
        'Delete',
        HOST,
        activity('Delete', { id: 'https://elsewhere.example/notes/9', type: 'Tombstone' }),
        user(),
        userRemote()
      );

      expect(db.removeRemoteContentByPostId).not.toHaveBeenCalled();
    });

    it('refuses to store a post keyed to a url the sender does not control', async () => {
      db.getRemoteContent.mockResolvedValue(null);

      await handle(
        'Create',
        HOST,
        activity('Create', { id: 'https://elsewhere.example/notes/1', type: 'Note', content: '<p>hi</p>' }),
        user(),
        userRemote()
      );

      expect(db.saveRemoteContent).not.toHaveBeenCalled();
    });

    it('refuses an Update naming somebody elses post, which would overwrite it', async () => {
      db.getRemoteContent.mockResolvedValue(null);

      await handle(
        'Update',
        HOST,
        activity('Update', { id: 'https://elsewhere.example/notes/1', type: 'Note', content: '<p>hi</p>' }),
        user(),
        userRemote()
      );

      expect(db.saveRemoteContent).not.toHaveBeenCalled();
    });

    it('compares origins, so a different path on the same host is fine', async () => {
      db.getRemoteContent.mockResolvedValue(null);

      await handle(
        'Create',
        HOST,
        activity('Create', { id: 'https://remote.example/some/other/path/1', type: 'Note', content: '<p>hi</p>' }),
        user(),
        userRemote()
      );

      expect(db.saveRemoteContent).toHaveBeenCalled();
    });

    it('falls back to the stored actor url when the activity names no actor', async () => {
      await handle(
        'Delete',
        HOST,
        { type: 'Delete', id: 'x', object: { id: 'https://remote.example/notes/9' }, to: [] } as never,
        user(),
        userRemote()
      );

      expect(db.removeRemoteContentByPostId).toHaveBeenCalledWith('alice', 'https://remote.example/notes/9');
    });

    it('drops a Create with no object id at all rather than throwing', async () => {
      await handle('Create', HOST, activity('Create', { type: 'Note', content: '<p>hi</p>' }), user(), userRemote());

      expect(db.saveRemoteContent).not.toHaveBeenCalled();
    });
  });

  it('stores a boost on Announce, fetching the original when it is a bare uri', async () => {
    db.getRemoteContent.mockResolvedValue(null);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'https://remote.example/notes/9', content: '<p>boosted</p>' }), {
        status: 200,
        headers: { 'content-type': 'application/activity+json' },
      })
    );

    await handle(
      'Announce',
      HOST,
      { type: 'Announce', id: 'x', actor: 'a', object: 'https://remote.example/notes/9', to: [] } as never,
      user(),
      userRemote()
    );

    expect(db.saveRemoteContent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'post', postId: 'https://remote.example/notes/9,announce' })
    );
  });

  it('does not store the same boost twice', async () => {
    db.getRemoteContent.mockResolvedValue(contentRemote());

    await handle(
      'Announce',
      HOST,
      {
        type: 'Announce',
        id: 'x',
        actor: 'a',
        object: { id: 'https://remote.example/notes/9', content: 'hi' },
        to: [],
      } as never,
      user(),
      userRemote()
    );

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });

  it('upserts on Update the same way it does on Create', async () => {
    db.getRemoteContent.mockResolvedValue(null);

    await handle(
      'Update',
      HOST,
      activity('Update', { id: 'https://remote.example/notes/9', type: 'Note', content: '<p>edited</p>' }),
      user(),
      userRemote()
    );

    expect(db.saveRemoteContent).toHaveBeenCalledWith(expect.objectContaining({ view: '<p>edited</p>' }));
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

    it('reads the reply count out of the peers AS2 replies collection', async () => {
      db.getRemoteContent.mockResolvedValue(null);
      const replies = { type: 'Collection', totalItems: 7, updated: '2026-03-04T00:00:00.000Z' };

      await handle('Create', HOST, activity('Create', { ...object, replies }), user(), userRemote());

      const saved = db.saveRemoteContent.mock.calls[0][0];
      expect(saved.commentsCount).toBe(7);
      expect(saved.commentsUpdated).toEqual(new Date('2026-03-04T00:00:00.000Z'));
    });

    it('prefers the AS2 collection over the flat Atom-shaped count', async () => {
      db.getRemoteContent.mockResolvedValue(null);
      const replies = { type: 'Collection', totalItems: 7 };

      await handle('Create', HOST, activity('Create', { ...object, replies, repliesCount: '2' }), user(), userRemote());

      expect(db.saveRemoteContent.mock.calls[0][0].commentsCount).toBe(7);
    });

    it('falls back when replies is a bare url, which we will not go and fetch', async () => {
      db.getRemoteContent.mockResolvedValue(null);

      await handle(
        'Create',
        HOST,
        activity('Create', { ...object, replies: 'https://remote.example/notes/1/replies' }),
        user(),
        userRemote()
      );

      // The fixture's flat repliesCount, since there is no inlined totalItems.
      expect(db.saveRemoteContent.mock.calls[0][0].commentsCount).toBe(4);
    });

    it('defaults a missing replies count to zero', async () => {
      db.getRemoteContent.mockResolvedValue(null);

      await handle('Create', HOST, activity('Create', { ...object, repliesCount: undefined }), user(), userRemote());

      expect(db.saveRemoteContent.mock.calls[0][0].commentsCount).toBe(0);
    });

    it('carries a peers content warning through, so the reader can collapse it', async () => {
      db.getRemoteContent.mockResolvedValue(null);

      await handle(
        'Create',
        HOST,
        activity('Create', { ...object, sensitive: true, summary: 'spoilers' }),
        user(),
        userRemote()
      );

      expect(db.saveRemoteContent.mock.calls[0][0]).toMatchObject({ sensitive: true, contentWarning: 'spoilers' });
    });

    it('treats a summary as a warning even when the flag is absent', async () => {
      db.getRemoteContent.mockResolvedValue(null);

      await handle('Create', HOST, activity('Create', { ...object, summary: 'cw' }), user(), userRemote());

      expect(db.saveRemoteContent.mock.calls[0][0]).toMatchObject({ sensitive: true, contentWarning: 'cw' });
    });

    it('leaves an ordinary post unmarked', async () => {
      db.getRemoteContent.mockResolvedValue(null);

      await handle('Create', HOST, activity('Create', object), user(), userRemote());

      expect(db.saveRemoteContent.mock.calls[0][0]).toMatchObject({ sensitive: false, contentWarning: null });
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

// Hashtags — Mastodon indexes a post into a tag timeline from the `tag` array,
// not by re-reading the body, so a #word that never reaches the array is a word
// nobody can search for.
describe('findHashtags', () => {
  it('finds a bare hashtag in the text', () => {
    expect(findHashtags('<p>about #fediverse today</p>')).toEqual(['fediverse']);
  });

  it('finds several, in the order they were written', () => {
    expect(findHashtags('<p>#one and #two</p>')).toEqual(['one', 'two']);
  });

  it('takes the authors own spelling when the same tag appears twice', () => {
    expect(findHashtags('<p>#Fediverse and #fediverse</p>')).toEqual(['Fediverse']);
  });

  it('reads tags out of anchors the editor marked up', () => {
    expect(findHashtags('<p><a class="p-category" href="/t/art">#art</a></p>')).toEqual(['art']);
  });

  // A `#` inside an href or a colour literal is not a tag, which is why only
  // text nodes are scanned.
  it('ignores a fragment in a link and a colour in an attribute', () => {
    expect(findHashtags('<p><a href="https://x.example/p#section">x</a></p>')).toEqual([]);
    expect(findHashtags('<p style="color:#ff0000">red</p>')).toEqual([]);
  });

  it('ignores a bare # and a hash glued to the end of a word', () => {
    expect(findHashtags('<p># alone and c#</p>')).toEqual([]);
  });

  it('accepts non-ascii tags, which are ordinary on the fediverse', () => {
    expect(findHashtags('<p>#café #日本語</p>')).toEqual(['café', '日本語']);
  });

  it('returns nothing rather than throwing on malformed html', () => {
    expect(findHashtags('<p><<<')).toEqual([]);
  });
});

describe('Note hashtags', () => {
  it('tags the Note, pointing each at a page that lists the tag', async () => {
    const message = await createNote(HOST, content({ view: '<p>on #art and #css</p>' }), user());

    expect((message.object as { tag: unknown[] }).tag).toEqual([
      { type: 'Hashtag', href: `https://${HOST}/alice/search/art`, name: '#art' },
      { type: 'Hashtag', href: `https://${HOST}/alice/search/css`, name: '#css' },
    ]);
  });

  it('url-encodes a tag that needs it', async () => {
    const message = await createNote(HOST, content({ view: '<p>#café</p>' }), user());

    expect((message.object as { tag: { href: string }[] }).tag[0].href).toBe(`https://${HOST}/alice/search/caf%C3%A9`);
  });

  it('carries mentions alongside hashtags rather than replacing them', async () => {
    const message = await createNote(HOST, content({ view: '<p>#art</p>' }), user(), undefined, undefined, [
      userRemote(),
    ]);
    const tag = (message.object as { tag: { type: string }[] }).tag;

    expect(tag.map((t) => t.type)).toEqual(['Hashtag', 'Mention']);
    expect((message.object as { cc: string[] }).cc).toContain('https://remote.example/users/bob');
  });

  it('emits an empty tag array for a post with neither', async () => {
    const message = await createNote(HOST, content(), user());

    expect((message.object as { tag: unknown[] }).tag).toEqual([]);
  });
});

describe('isSameOrigin', () => {
  it('is true for the same scheme, host and port', () => {
    expect(isSameOrigin('https://a.example/notes/1', 'https://a.example/users/bob')).toBe(true);
  });

  it('is false across hosts, schemes and ports', () => {
    expect(isSameOrigin('https://b.example/notes/1', 'https://a.example/users/bob')).toBe(false);
    expect(isSameOrigin('http://a.example/notes/1', 'https://a.example/users/bob')).toBe(false);
    expect(isSameOrigin('https://a.example:8443/n/1', 'https://a.example/users/bob')).toBe(false);
  });

  it('is false rather than throwing on something that is not a url', () => {
    expect(isSameOrigin('not-a-url', 'https://a.example/users/bob')).toBe(false);
    expect(isSameOrigin('https://a.example/notes/1', '')).toBe(false);
  });
});

// A peer that rotates its signing key used to become permanently unverifiable:
// the key we had was the one from discovery day, and nothing ever re-read it.
describe('refreshRemoteKey', () => {
  it('re-reads the actor document and stores the new key', async () => {
    discover.getActivityPubActor.mockResolvedValue({ publicKey: { publicKeyPem: 'NEW-PEM' } });

    const refreshed = await refreshRemoteKey(userRemote({ magicKey: 'OLD-PEM' }));

    expect(refreshed?.magicKey).toBe('NEW-PEM');
    expect(db.saveRemoteUser).toHaveBeenCalledWith(expect.objectContaining({ magicKey: 'NEW-PEM' }));
  });

  it('picks up a rotated Ed25519 key at the same time', async () => {
    const multibase = proofKeys().publicKeyMultibase;
    discover.getActivityPubActor.mockResolvedValue({
      publicKey: { publicKeyPem: 'NEW-PEM' },
      assertionMethod: [{ type: 'Multikey', publicKeyMultibase: multibase }],
    });

    const refreshed = await refreshRemoteKey(userRemote({ magicKey: 'OLD-PEM' }));

    expect(refreshed?.ed25519PublicKey).toBe(multibase);
  });

  it('keeps the Ed25519 key we had when the rotated document publishes none', async () => {
    discover.getActivityPubActor.mockResolvedValue({ publicKey: { publicKeyPem: 'NEW-PEM' } });

    const refreshed = await refreshRemoteKey(userRemote({ magicKey: 'OLD', ed25519PublicKey: 'kept' }));

    expect(refreshed?.ed25519PublicKey).toBe('kept');
  });

  // If the key is the same, the signature failed for some other reason, and
  // rewriting the row would only hide that.
  it('does nothing when the published key is the one we already had', async () => {
    discover.getActivityPubActor.mockResolvedValue({ publicKey: { publicKeyPem: 'SAME' } });

    await expect(refreshRemoteKey(userRemote({ magicKey: 'SAME' }))).resolves.toBeNull();
    expect(db.saveRemoteUser).not.toHaveBeenCalled();
  });

  it('is null when the actor cannot be fetched', async () => {
    discover.getActivityPubActor.mockRejectedValue(new Error('offline'));

    await expect(refreshRemoteKey(userRemote())).resolves.toBeNull();
  });

  it('is null when the document publishes no key', async () => {
    discover.getActivityPubActor.mockResolvedValue({});

    await expect(refreshRemoteKey(userRemote())).resolves.toBeNull();
  });

  it('is null when we have no actor url to ask', async () => {
    await expect(refreshRemoteKey(userRemote({ activityPubActorUrl: null, profileUrl: '' }))).resolves.toBeNull();
    expect(discover.getActivityPubActor).not.toHaveBeenCalled();
  });
});

// Delivery used to end at `catch { /* Not a big deal if this fails */ }`, which
// is how a post silently failed to reach an inbox that happened to be
// restarting.
describe('queued delivery', () => {
  const inbox = 'https://remote.example/users/bob/inbox';
  const owner = () => user({ privateKey: keys().privateKeyPkcs1 });
  const peer = () => userRemote({ activityPubInboxUrl: inbox });

  it('queues an activity the inbox refused with a 503', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 503 }));

    await deliver(HOST, owner(), [peer()], createGenericMessage('Create', HOST, 'id-1', owner(), 'x'));

    expect(queue.enqueueDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'alice', inboxUrl: inbox, activityId: 'id-1' })
    );
  });

  it('queues one the request never reached at all', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await deliver(HOST, owner(), [peer()], createGenericMessage('Create', HOST, 'id-1', owner(), 'x'));

    expect(queue.enqueueDelivery).toHaveBeenCalled();
  });

  // The stored payload is re-signed at each attempt, so it must go in unsigned:
  // an HTTP signature is good for five minutes and a proof carries a `created`.
  it('stores the activity unsigned, because both signatures expire', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 503 }));
    const proofOwner = user({ privateKey: keys().privateKeyPkcs1, ed25519PrivateKey: proofKeys().privateKeyPem });

    await deliver(HOST, proofOwner, [peer()], createGenericMessage('Create', HOST, 'id-1', proofOwner, 'x'));

    const stored = JSON.parse(queue.enqueueDelivery.mock.calls[0][0].message);
    expect(stored.proof).toBeUndefined();
    expect(stored.id).toBe('id-1');
  });

  it('does not queue a delivery that succeeded', async () => {
    await deliver(HOST, owner(), [peer()], createGenericMessage('Create', HOST, 'id-1', owner(), 'x'));

    expect(queue.enqueueDelivery).not.toHaveBeenCalled();
  });

  it('does not queue one the peer understood and refused', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response('', { status: 422 }));

    await deliver(HOST, owner(), [peer()], createGenericMessage('Create', HOST, 'id-1', owner(), 'x'));

    expect(queue.enqueueDelivery).not.toHaveBeenCalled();
  });

  it('retires an inbox that answers 410 Gone, rather than queueing for it', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 410 }));

    await deliver(HOST, owner(), [peer()], createGenericMessage('Create', HOST, 'id-1', owner(), 'x'));

    expect(queue.retireInbox).toHaveBeenCalledWith(inbox);
    expect(queue.enqueueDelivery).not.toHaveBeenCalled();
  });

  it('queues per inbox, so one dead peer does not cost the others', async () => {
    fetchMock.mockImplementation((url: string) =>
      url.includes('two') ? Promise.resolve(new Response('', { status: 503 })) : Promise.resolve(new Response('{}'))
    );

    await deliver(
      HOST,
      owner(),
      [peer(), userRemote({ id: 2, profileUrl: 'p2', activityPubInboxUrl: 'https://two.example/inbox' })],
      createGenericMessage('Create', HOST, 'id-1', owner(), 'x')
    );

    expect(queue.enqueueDelivery).toHaveBeenCalledTimes(1);
    expect(queue.enqueueDelivery.mock.calls[0][0].inboxUrl).toBe('https://two.example/inbox');
  });
});

describe('runDeliveryQueue', () => {
  const inbox = 'https://remote.example/users/bob/inbox';
  const owner = () => user({ privateKey: keys().privateKeyPkcs1 });
  const pending = (overrides = {}) => ({
    id: 1,
    username: 'alice',
    inboxUrl: inbox,
    activityId: 'id-1',
    message: JSON.stringify({ '@context': 'x', type: 'Create', id: 'id-1', actor: 'a', to: [], object: 'o' }),
    attempts: 1,
    ...overrides,
  });

  beforeEach(() => {
    db.getLocalUserByUsername.mockResolvedValue(owner());
  });

  it('re-signs and re-sends, then drops the row', async () => {
    queue.dueDeliveries.mockResolvedValue([pending()] as never);

    await expect(runDeliveryQueue(HOST)).resolves.toMatchObject({ sent: 1 });

    expect(fetchMock.mock.calls[0][0]).toBe(inbox);
    expect(fetchMock.mock.calls[0][1].headers.Signature).toContain('keyId=');
    expect(queue.dropDelivery).toHaveBeenCalledWith(1);
  });

  // The signature it was queued with expired long ago; a retry that reused it
  // would be rejected for a stale Date rather than delivered.
  it('signs afresh, not with whatever the first attempt used', async () => {
    queue.dueDeliveries.mockResolvedValue([pending()] as never);

    await runDeliveryQueue(HOST);

    const date = new Date(fetchMock.mock.calls[0][1].headers.Date).getTime();
    expect(Math.abs(Date.now() - date)).toBeLessThan(60 * 1000);
  });

  it('keeps the activity id stable, so a retry is not a second post', async () => {
    queue.dueDeliveries.mockResolvedValue([pending()] as never);

    await runDeliveryQueue(HOST);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).id).toBe('id-1');
  });

  it('reschedules one that failed again', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 502 }));
    queue.dueDeliveries.mockResolvedValue([pending()] as never);

    await expect(runDeliveryQueue(HOST)).resolves.toMatchObject({ retrying: 1 });
    expect(queue.rescheduleDelivery).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), expect.any(String));
  });

  it('retires an inbox that has since gone', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 410 }));
    queue.dueDeliveries.mockResolvedValue([pending()] as never);

    await expect(runDeliveryQueue(HOST)).resolves.toMatchObject({ dropped: 1 });
    expect(queue.retireInbox).toHaveBeenCalledWith(inbox);
  });

  it('drops one for a user who no longer exists', async () => {
    db.getLocalUserByUsername.mockResolvedValue(null);
    queue.dueDeliveries.mockResolvedValue([pending()] as never);

    await runDeliveryQueue(HOST);

    expect(queue.dropDelivery).toHaveBeenCalledWith(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('drops one whose payload no longer parses', async () => {
    queue.dueDeliveries.mockResolvedValue([pending({ message: 'not json' })] as never);

    await runDeliveryQueue(HOST);

    expect(queue.dropDelivery).toHaveBeenCalledWith(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reads each user once, however many deliveries they have queued', async () => {
    queue.dueDeliveries.mockResolvedValue([pending(), pending({ id: 2, activityId: 'id-2' })] as never);

    await runDeliveryQueue(HOST);

    expect(db.getLocalUserByUsername).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('signs under the users own hostname when they have one', async () => {
    db.getLocalUserByUsername.mockResolvedValue(user({ privateKey: keys().privateKeyPkcs1, hostname: 'own.example' }));
    queue.dueDeliveries.mockResolvedValue([pending()] as never);

    await runDeliveryQueue(HOST);

    expect(fetchMock.mock.calls[0][1].headers.Signature).toContain('https://own.example/ap/alice#main-key');
  });

  it('clears out rows that have run out of attempts', async () => {
    queue.pruneExhaustedDeliveries.mockResolvedValue(2 as never);

    await expect(runDeliveryQueue(HOST)).resolves.toMatchObject({ dropped: 2 });
  });
});
