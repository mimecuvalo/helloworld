import crypto from 'node:crypto';
import magic from 'magic-signatures';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  getLocalContent: vi.fn(),
  getLocalLatestContent: vi.fn(),
  getLocalUser: vi.fn(),
  getRemoteAllUsers: vi.fn(),
  getRemoteCommentsOnLocalContent: vi.fn(),
  getRemoteContent: vi.fn(),
  getRemoteFriends: vi.fn(),
  getRemoteUser: vi.fn(),
  getRemoteUserByActor: vi.fn(),
  removeOldRemoteContent: vi.fn(),
  removeRemoteContent: vi.fn(),
  removeRemoteUser: vi.fn(),
  saveRemoteContent: vi.fn(),
  saveRemoteUser: vi.fn(),
}));
const feeds = vi.hoisted(() => ({
  retrieveFeed: vi.fn(),
  parseFeedAndInsertIntoDb: vi.fn(),
  parseFeed: vi.fn(),
}));
const discover = vi.hoisted(() => ({
  discoverUserRemoteInfoSaveAndSubscribe: vi.fn(),
  getActivityPubActor: vi.fn(),
  getUserRemoteInfo: vi.fn(),
}));

vi.mock('server/social/db', () => db);
vi.mock('server/social/feeds', () => feeds);
vi.mock('server/social/discover-user', () => discover);
vi.mock('server/config', () => ({
  CRON_SECRET: 'cron-secret',
  DATABASE_URL: '',
  DEV_LOGIN_EMAIL: undefined,
  NODE_ENV: 'test',
  AUTH_SECRET: 'x',
  AUTH_GOOGLE_ID: '',
  AUTH_GOOGLE_SECRET: '',
  S3_AWS_REGION: '',
  S3_AWS_ACCESS_KEY: '',
  S3_AWS_SECRET_KEY: '',
  S3_AWS_S3_BUCKET_NAME: '',
}));

import type { Context } from 'server/context';
import type { AppEnv } from 'server/env';
import { socialRoutes } from 'server/routes/social';
import { HOST, content, contentRemote, keys, user, userRemote } from './fixtures';

const ALICE_PROFILE = `https://${HOST}/alice`;
const CONTENT_URL = `https://${HOST}/alice/blog/hello`;

let currentUser: ReturnType<typeof user> | null;
let fetchMock: ReturnType<typeof vi.fn>;

// Mirrors server/app.ts: /api base path, ctx on every request, socialRoutes at /social.
function api() {
  const app = new Hono<AppEnv>().basePath('/api');
  app.use('*', async (c, next) => {
    c.set('ctx', {
      currentUsername: currentUser?.username || '',
      currentUser,
      hostname: HOST,
      prisma: {},
      loaders: {},
      request: c.req.raw,
    } as unknown as Context);
    await next();
  });
  return app.route('/social', socialRoutes);
}

function get(path: string, init: RequestInit = {}) {
  return api().request(`http://${HOST}${path}`, {
    ...init,
    headers: { host: HOST, ...(init.headers as Record<string, string>) },
  });
}

const q = (path: string, resource = ALICE_PROFILE) => `${path}?resource=${encodeURIComponent(resource)}`;

function parseXml(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  return doc;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('DEV', false);
  currentUser = null;
  fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 202 }));
  vi.stubGlobal('fetch', fetchMock);
  db.getLocalUser.mockResolvedValue(user());
  db.getLocalContent.mockResolvedValue(content());
  db.getLocalLatestContent.mockResolvedValue([content()]);
  db.getRemoteCommentsOnLocalContent.mockResolvedValue([contentRemote()]);
  db.getRemoteFriends.mockResolvedValue([[], []]);
  db.getRemoteAllUsers.mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('GET|POST /api/social/update-feeds', () => {
  const cron = (init: RequestInit = {}) => get('/api/social/update-feeds', init);
  const authed = { authorization: 'Bearer cron-secret' };

  it.each(['GET', 'POST'])('accepts the cron secret over %s', async (method) => {
    const response = await cron({ method, headers: authed });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('rejects a request with no authorization', async () => {
    const response = await cron();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ msg: 'i call shenanigans.' });
    expect(db.removeOldRemoteContent).not.toHaveBeenCalled();
  });

  it.each([
    ['wrong secret', 'Bearer nope'],
    ['bare token', 'cron-secret'],
    ['basic auth', 'Basic Y3Jvbg=='],
  ])('rejects a %s', async (_label, authorization) => {
    expect((await cron({ headers: { authorization } })).status).toBe(400);
    expect(db.getRemoteAllUsers).not.toHaveBeenCalled();
  });

  it('prunes old remote content before pulling anything new', async () => {
    const order: string[] = [];
    db.removeOldRemoteContent.mockImplementation(async () => void order.push('prune'));
    db.getRemoteAllUsers.mockImplementation(async () => {
      order.push('list');
      return [];
    });

    await cron({ headers: authed });

    expect(order).toEqual(['prune', 'list']);
  });

  it('pulls and ingests the feed of every followed user', async () => {
    const bob = userRemote({ id: 1, feedUrl: 'https://a.example/feed' });
    const carol = userRemote({ id: 2, feedUrl: 'https://b.example/feed' });
    db.getRemoteAllUsers.mockResolvedValue([bob, carol]);
    feeds.retrieveFeed.mockResolvedValue('<feed/>');

    await cron({ headers: authed });

    expect(feeds.retrieveFeed.mock.calls.map((call) => call[0])).toEqual([bob.feedUrl, carol.feedUrl]);
    expect(feeds.parseFeedAndInsertIntoDb).toHaveBeenNthCalledWith(1, bob, '<feed/>');
    expect(feeds.parseFeedAndInsertIntoDb).toHaveBeenNthCalledWith(2, carol, '<feed/>');
  });

  it('keeps going when one peer is unreachable', async () => {
    const bob = userRemote({ id: 1, feedUrl: 'https://down.example/feed' });
    const carol = userRemote({ id: 2, feedUrl: 'https://up.example/feed' });
    db.getRemoteAllUsers.mockResolvedValue([bob, carol]);
    feeds.retrieveFeed.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce('<feed/>');

    const response = await cron({ headers: authed });

    expect(response.status).toBe(200);
    expect(feeds.parseFeedAndInsertIntoDb).toHaveBeenCalledTimes(1);
    expect(feeds.parseFeedAndInsertIntoDb).toHaveBeenCalledWith(carol, '<feed/>');
  });
});

describe('GET /api/social/.well-known/host-meta', () => {
  it('serves XRD pointing at the webfinger lrdd endpoint', async () => {
    const response = await get('/api/social/.well-known/host-meta');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xrd+xml');

    const doc = parseXml(await response.text());
    const templates = [...doc.getElementsByTagName('Link')].map((link) => [
      link.getAttribute('type'),
      link.getAttribute('template'),
    ]);
    expect(templates).toEqual([
      ['application/json', `https://${HOST}/.well-known/webfinger?resource={uri}`],
      ['application/xrd+xml', `https://${HOST}/.well-known/webfinger?format=xml&resource={uri}`],
    ]);
    expect(doc.getElementsByTagName('hm:Host')[0].textContent).toBe(`https://${HOST}`);
  });
});

describe('GET /api/social/.well-known/webfinger', () => {
  const rel = (links: { rel: string; href: string; type?: string }[], name: string) =>
    links.find((link) => link.rel === name);

  it('404s for an unknown account', async () => {
    db.getLocalUser.mockResolvedValue(null);

    expect((await get(q('/api/social/.well-known/webfinger', 'acct:nobody@example.com'))).status).toBe(404);
  });

  it('returns the acct subject and profile alias', async () => {
    const response = await get(q('/api/social/.well-known/webfinger'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.subject).toBe(`acct:alice@${HOST}`);
    expect(body.aliases).toEqual([ALICE_PROFILE]);
  });

  it('advertises every federation endpoint a peer needs', async () => {
    const { links } = await (await get(q('/api/social/.well-known/webfinger'))).json();

    expect(rel(links, 'http://schemas.google.com/g/2010#updates-from')).toMatchObject({
      type: 'application/atom+xml',
      href: `https://${HOST}/api/social/feed?resource=${encodeURIComponent(ALICE_PROFILE)}`,
    });
    expect(rel(links, 'salmon')?.href).toContain('/api/social/salmon');
    expect(rel(links, 'webmention')?.href).toContain('/api/social/webmention');
    expect(rel(links, 'http://ostatus.org/schema/1.0/subscribe')?.href).toContain('/api/social/follow');
    expect(rel(links, 'self')).toMatchObject({
      type: 'application/activity+json',
      href: expect.stringContaining('/api/social/activitypub/actor'),
    });
    expect(rel(links, 'http://webfinger.net/rel/profile-page')?.href).toBe(ALICE_PROFILE);
  });

  it('publishes the magic public key as a data uri', async () => {
    db.getLocalUser.mockResolvedValue(user({ magicKey: 'RSA.abc.AQAB' }));

    const { links } = await (await get(q('/api/social/.well-known/webfinger'))).json();

    expect(rel(links, 'magic-public-key')?.href).toBe('data:application/magic-public-key,RSA.abc.AQAB');
  });

  it('falls back to the favicon for the avatar link', async () => {
    db.getLocalUser.mockResolvedValue(user({ logo: null, favicon: '/favicon.jpg' }));

    const { links } = await (await get(q('/api/social/.well-known/webfinger'))).json();

    expect(rel(links, 'http://webfinger.net/rel/avatar')?.href).toBe(`https://${HOST}/favicon.jpg`);
  });

  it('serves the same document as XRD when format=xml', async () => {
    const response = await get(`${q('/api/social/.well-known/webfinger')}&format=xml`);
    const xml = await response.text();

    expect(response.headers.get('content-type')).toContain('application/xrd+xml');
    const doc = parseXml(xml);
    expect(doc.getElementsByTagName('Subject')[0].textContent).toBe(`acct:alice@${HOST}`);
    expect(doc.getElementsByTagName('Alias')[0].textContent).toBe(ALICE_PROFILE);
    expect([...doc.getElementsByTagName('Link')].some((link) => link.getAttribute('rel') === 'salmon')).toBe(true);
  });

  it('escapes ampersands in XRD hrefs so the document stays well-formed', async () => {
    const response = await get(`${q('/api/social/.well-known/webfinger')}&format=xml`);

    // Every href carries a ?resource= query; a raw & would break the parse.
    parseXml(await response.text());
  });
});

describe('GET /api/social/oembed', () => {
  it('404s when the item or its owner is unknown', async () => {
    db.getLocalContent.mockResolvedValue(null);
    expect((await get(q('/api/social/oembed', CONTENT_URL))).status).toBe(404);

    db.getLocalContent.mockResolvedValue(content());
    db.getLocalUser.mockResolvedValue(null);
    expect((await get(q('/api/social/oembed', CONTENT_URL))).status).toBe(404);
  });

  it('returns a rich oembed document with the oembed content type', async () => {
    const response = await get(q('/api/social/oembed', CONTENT_URL));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json+oembed');
    await expect(response.json()).resolves.toMatchObject({
      type: 'rich',
      version: '1.0',
      provider_url: `https://${HOST}/`,
      title: 'Hello',
      author_name: 'alice',
      author_url: ALICE_PROFILE,
      provider_name: "Alice's site",
    });
  });

  it('links the html back to the item and appends the stats pixel', async () => {
    const { html } = await (await get(q('/api/social/oembed', CONTENT_URL))).json();

    expect(html).toContain(`<a href="${CONTENT_URL}">`);
    expect(html).toContain('/api/stats?resource=');
  });

  it('reports thumbnail dimensions when there is a thumbnail', async () => {
    db.getLocalContent.mockResolvedValue(content({ thumb: '/resource/thumb.jpg' }));

    const body = await (await get(q('/api/social/oembed', CONTENT_URL))).json();

    expect(body).toMatchObject({
      thumbnail_url: `https://${HOST}/resource/thumb.jpg`,
      thumbnail_width: 154,
      thumbnail_height: 154,
      width: 154,
      height: 154,
    });
  });

  it('omits dimensions entirely when there is no image at all', async () => {
    db.getLocalContent.mockResolvedValue(content({ thumb: '' }));
    db.getLocalUser.mockResolvedValue(user({ logo: null, favicon: null }));

    const body = await (await get(q('/api/social/oembed', CONTENT_URL))).json();

    expect(body.thumbnail_url).toBeUndefined();
    expect(body.width).toBeUndefined();
    expect(body.html).toContain('>Hello<');
  });
});

describe('/api/social/websub', () => {
  it.each(['GET', 'POST'])('acknowledges %s without a body', async (method) => {
    const response = await get('/api/social/websub', { method });

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('');
  });
});

describe('GET /api/social/feed', () => {
  it('404s for an unknown user', async () => {
    db.getLocalUser.mockResolvedValue(null);

    expect((await get(q('/api/social/feed'))).status).toBe(404);
    expect(db.getLocalLatestContent).not.toHaveBeenCalled();
  });

  it('serves an Atom feed of the latest content', async () => {
    const response = await get(q('/api/social/feed'));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xml');
    const doc = parseXml(await response.text());
    expect(doc.documentElement.tagName).toBe('feed');
    expect(doc.querySelectorAll('entry')).toHaveLength(1);
    expect(db.getLocalLatestContent).toHaveBeenCalledWith(ALICE_PROFILE);
  });

  it('caches at the CDN for a day, which is safe because the feed is public-only', async () => {
    const response = await get(q('/api/social/feed'));

    expect(response.headers.get('cache-control')).toBe('public, s-maxage=86400');
  });

  it('sets the self link to the full request path including the query', async () => {
    const doc = parseXml(await (await get(q('/api/social/feed'))).text());

    expect(doc.querySelector('feed > link[rel="self"]')?.getAttribute('href')).toBe(
      `https://${HOST}${q('/api/social/feed')}`
    );
  });

  it('honors the x-hw-host header for multi-tenant hosting', async () => {
    const response = await get(q('/api/social/feed'), { headers: { 'x-hw-host': 'tenant.example' } });
    const doc = parseXml(await response.text());

    expect(doc.querySelector('feed > link[rel="self"]')?.getAttribute('href')).toContain('https://tenant.example/');
  });
});

describe('GET /api/social/comments', () => {
  it('404s for an unknown user', async () => {
    db.getLocalUser.mockResolvedValue(null);

    expect((await get(q('/api/social/comments', CONTENT_URL))).status).toBe(404);
  });

  it('serves the remote comments on an item as Atom', async () => {
    const response = await get(q('/api/social/comments', CONTENT_URL));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xml');
    expect(db.getRemoteCommentsOnLocalContent).toHaveBeenCalledWith(CONTENT_URL);

    const doc = parseXml(await response.text());
    expect(doc.querySelectorAll('entry')).toHaveLength(1);
    expect(doc.querySelector('entry > author > name')?.textContent).toBe('bob');
  });

  it('is not CDN-cached, since comments change with every inbound mention', async () => {
    const response = await get(q('/api/social/comments', CONTENT_URL));

    expect(response.headers.get('cache-control')).toBeNull();
  });
});

describe('GET /api/social/foaf', () => {
  it('404s for an unknown user', async () => {
    db.getLocalUser.mockResolvedValue(null);

    expect((await get(q('/api/social/foaf'))).status).toBe(404);
  });

  it('serves the friends graph as RDF', async () => {
    db.getRemoteFriends.mockResolvedValue([[userRemote({ username: 'follower' })], [userRemote()]]);

    const response = await get(q('/api/social/foaf'));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xrd+xml');
    expect(db.getRemoteFriends).toHaveBeenCalledWith(ALICE_PROFILE);

    const doc = parseXml(await response.text());
    expect(doc.getElementsByTagNameNS('http://xmlns.com/foaf/0.1/', 'Agent')).toHaveLength(2);
  });
});

describe('GET /api/social/activitypub/actor', () => {
  it('404s for an unknown user', async () => {
    db.getLocalUser.mockResolvedValue(null);

    expect((await get(q('/api/social/activitypub/actor'))).status).toBe(404);
  });

  it('serves a Person actor with the activitystreams and security contexts', async () => {
    const body = await (await get(q('/api/social/activitypub/actor'))).json();

    expect(body['@context']).toEqual(['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1']);
    expect(body).toMatchObject({
      type: 'Person',
      preferredUsername: 'alice',
      url: ALICE_PROFILE,
      id: `https://${HOST}/api/social/activitypub/actor?resource=${encodeURIComponent(ALICE_PROFILE)}`,
      inbox: `https://${HOST}/api/social/activitypub/inbox?resource=${encodeURIComponent(ALICE_PROFILE)}`,
    });
    expect(body.publicKey).toMatchObject({ id: `${body.id}#main-key`, owner: body.id });
  });

  it('exports the magic key as a PEM peers can verify signatures with', async () => {
    db.getLocalUser.mockResolvedValue(user({ magicKey: magic.RSAToMagic(keys().publicKey) }));

    const body = await (await get(q('/api/social/activitypub/actor'))).json();

    expect(body.publicKey.publicKeyPem.replace(/\r/g, '').trim()).toBe(keys().publicKey.trim());
  });

  it('still serves an actor with an empty key when the user has no magic key yet', async () => {
    db.getLocalUser.mockResolvedValue(user({ magicKey: '' }));

    const response = await get(q('/api/social/activitypub/actor'));

    expect(response.status).toBe(200);
    expect((await response.json()).publicKey.publicKeyPem).toBe('');
  });
});

describe('GET /api/social/activitypub/message', () => {
  it('404s when the item or its owner is unknown', async () => {
    db.getLocalContent.mockResolvedValue(null);
    expect((await get(q('/api/social/activitypub/message', CONTENT_URL))).status).toBe(404);

    db.getLocalContent.mockResolvedValue(content());
    db.getLocalUser.mockResolvedValue(null);
    expect((await get(q('/api/social/activitypub/message', CONTENT_URL))).status).toBe(404);
  });

  it('returns the bare Article object, not the Create wrapper', async () => {
    const body = await (await get(q('/api/social/activitypub/message', CONTENT_URL))).json();

    expect(body).toMatchObject({
      type: 'Article',
      url: CONTENT_URL,
      title: 'Hello',
      attributedTo: expect.stringContaining('/api/social/activitypub/actor'),
      to: 'https://www.w3.org/ns/activitystreams#Public',
    });
    expect(body['@context']).toBeUndefined();
    expect(body.object).toBeUndefined();
  });
});

describe('hidden items never leak over the federation surface', () => {
  // The social surface is unauthenticated: there is no owner-viewing escape
  // hatch, so hidden must always mean "not published", the way
  // server/services/content.ts treats it for every non-owner.
  const hidden = () => content({ hidden: true, title: 'Secret drafts', view: '<p>unreleased</p>' });

  it('keeps a hidden item out of the atom feed', async () => {
    // getLocalLatestContent constrains on hidden: false, so the route never
    // sees one; assert it asks through that query and renders only what it got.
    db.getLocalLatestContent.mockResolvedValue([]);

    const doc = parseXml(await (await get(q('/api/social/feed'))).text());

    expect(db.getLocalLatestContent).toHaveBeenCalledWith(ALICE_PROFILE);
    expect(doc.querySelectorAll('entry')).toHaveLength(0);
  });

  it('does not serve a hidden item as an ActivityPub Article', async () => {
    db.getLocalContent.mockResolvedValue(hidden());

    const response = await get(q('/api/social/activitypub/message', CONTENT_URL));

    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('unreleased');
  });

  it('does not describe a hidden item over oembed', async () => {
    db.getLocalContent.mockResolvedValue(hidden());

    const response = await get(q('/api/social/oembed', CONTENT_URL));

    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('Secret drafts');
  });
});

describe('POST /api/social/activitypub/inbox', () => {
  const path = q('/api/social/activitypub/inbox');
  const activity = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Follow',
    id: 'https://remote.example/follows/1',
    actor: 'https://remote.example/users/bob',
    object: ALICE_PROFILE,
  };

  function signedHeaders(date = new Date(), target = path, body: unknown = activity) {
    const signable = `(request-target): post ${target}\n` + `host: ${HOST}\n` + `date: ${date.toUTCString()}`;
    const signer = crypto.createSign('sha256');
    signer.update(signable);
    signer.end();
    const signature = signer.sign(keys().privateKeyPkcs1).toString('base64');
    return {
      headers: {
        'content-type': 'application/activity+json',
        date: date.toUTCString(),
        signature: `keyId="k",headers="(request-target) host date",signature="${signature}"`,
      },
      body: JSON.stringify(body),
    };
  }

  const post = (init: { headers: Record<string, string>; body: string }, at = path) =>
    get(at, { method: 'POST', ...init });

  beforeEach(() => {
    db.getRemoteUserByActor.mockResolvedValue(userRemote({ magicKey: keys().publicKey }));
  });

  it('400s without a resource', async () => {
    const response = await post(signedHeaders(), '/api/social/activitypub/inbox');

    expect(response.status).toBe(400);
  });

  it('404s for an unknown local user', async () => {
    db.getLocalUser.mockResolvedValue(null);

    expect((await post(signedHeaders())).status).toBe(404);
  });

  it('401s when the actor cannot be resolved to a remote user', async () => {
    db.getRemoteUserByActor.mockResolvedValue(null);
    discover.getActivityPubActor.mockResolvedValue({ id: 'x' });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect((await post(signedHeaders())).status).toBe(401);
  });

  it('401s when the signature does not verify', async () => {
    const signed = signedHeaders();
    signed.headers.signature = signed.headers.signature.replace(/signature="[^"]+"/, 'signature="bogus"');

    expect((await post(signed)).status).toBe(401);
    expect(db.saveRemoteUser).not.toHaveBeenCalled();
  });

  it('401s when the signing key does not match the sender we know', async () => {
    const otherKey = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    }).publicKey;
    db.getRemoteUserByActor.mockResolvedValue(userRemote({ magicKey: otherKey }));

    expect((await post(signedHeaders())).status).toBe(401);
  });

  it.each([
    ['too old', -10 * 60 * 1000],
    ['too far in the future', 10 * 60 * 1000],
  ])('401s on a replayed request dated %s', async (_label, offset) => {
    expect((await post(signedHeaders(new Date(Date.now() + offset)))).status).toBe(401);
  });

  it('accepts a request inside the five-minute clock-skew window', async () => {
    expect((await post(signedHeaders(new Date(Date.now() - 60 * 1000)))).status).toBe(204);
  });

  it('401s when the signature header is missing entirely', async () => {
    const signed = signedHeaders();
    signed.headers.signature = '';

    expect((await post(signed)).status).toBe(401);
  });

  it('accepts a signed Follow, records the follower and returns 204', async () => {
    const response = await post(signedHeaders());

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(db.saveRemoteUser).toHaveBeenCalledWith(expect.objectContaining({ follower: true }));
  });

  it('sends an Accept back to the follower inbox', async () => {
    db.getRemoteUserByActor.mockResolvedValue(
      userRemote({ magicKey: keys().publicKey, activityPubInboxUrl: 'https://remote.example/inbox' })
    );
    db.getLocalUser.mockResolvedValue(user({ privateKey: keys().privateKeyPkcs1 }));

    await post(signedHeaders());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledWith('https://remote.example/inbox', expect.any(Object));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ type: 'Accept' });
  });

  it('stores an inbound Create as remote content', async () => {
    db.getRemoteContent.mockResolvedValue(null);
    const note = {
      ...activity,
      type: 'Create',
      object: { id: 'https://remote.example/notes/1', type: 'Note', content: '<p>hi</p>', title: 'A note' },
    };

    const response = await post(signedHeaders(new Date(), path, note));

    expect(response.status).toBe(204);
    expect(db.saveRemoteContent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'post', postId: 'https://remote.example/notes/1', view: '<p>hi</p>' })
    );
  });
});

describe('POST /api/social/salmon', () => {
  const path = q('/api/social/salmon');
  const activity = { type: 'Follow', actor: 'https://remote.example/users/bob', object: ALICE_PROFILE };

  function envelope(body: unknown = activity, signingKey = keys().privateKeyPkcs1) {
    const signed = magic.sign({ data: JSON.stringify(body), data_type: 'application/ld+json' }, signingKey);
    signed.sigs[0].value = magic.btob64u(signed.sigs[0].value);
    return JSON.stringify(signed);
  }

  const post = (body: string, at = path) =>
    get(at, { method: 'POST', headers: { 'content-type': 'application/json' }, body });

  beforeEach(() => {
    db.getRemoteUserByActor.mockResolvedValue(userRemote({ magicKey: keys().publicKey }));
  });

  it('400s without a resource', async () => {
    expect((await post(envelope(), '/api/social/salmon')).status).toBe(400);
  });

  it('404s for an unknown local user', async () => {
    db.getLocalUser.mockResolvedValue(null);

    expect((await post(envelope())).status).toBe(404);
  });

  it('401s when the actor is unknown', async () => {
    db.getRemoteUserByActor.mockResolvedValue(null);
    discover.getActivityPubActor.mockResolvedValue({ id: 'x' });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect((await post(envelope())).status).toBe(401);
  });

  it('401s when the envelope was signed by someone else', async () => {
    const other = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });

    expect((await post(envelope(activity, other.privateKey))).status).toBe(401);
    expect(db.saveRemoteUser).not.toHaveBeenCalled();
  });

  it('401s when the envelope payload was tampered with after signing', async () => {
    const signed = JSON.parse(envelope());
    signed.data = magic.btob64u(Buffer.from(JSON.stringify({ ...activity, type: 'Like' })));

    expect((await post(JSON.stringify(signed))).status).toBe(401);
  });

  it('accepts a validly signed Follow and returns 204', async () => {
    const response = await post(envelope());

    expect(response.status).toBe(204);
    expect(db.saveRemoteUser).toHaveBeenCalledWith(expect.objectContaining({ follower: true }));
  });
});

describe('POST /api/social/webmention', () => {
  const form = (fields: Record<string, string>) =>
    get(q('/api/social/webmention'), {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    });

  beforeEach(() => {
    db.getRemoteUser.mockResolvedValue(userRemote());
    db.getRemoteContent.mockResolvedValue(null);
    discover.getUserRemoteInfo.mockResolvedValue(userRemote());
    fetchMock.mockResolvedValue(
      new Response(
        `<html><body><div class="h-entry"><h1 class="p-name">Re</h1><div class="e-content">hi</div></div></body></html>`,
        { status: 200, headers: { 'content-type': 'text/html' } }
      )
    );
  });

  it.each([
    ['source', { target: CONTENT_URL }],
    ['target', { source: 'https://remote.example/n/1' }],
    ['both', {}],
  ])('400s when %s is missing', async (_label, fields) => {
    const response = await form(fields as Record<string, string>);

    expect(response.status).toBe(400);
    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });

  it('400s when the resource query is missing', async () => {
    const response = await get('/api/social/webmention', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ source: 'https://remote.example/n/1', target: CONTENT_URL }).toString(),
    });

    expect(response.status).toBe(400);
  });

  it('404s for an unknown local user', async () => {
    db.getLocalUser.mockResolvedValue(null);

    expect((await form({ source: 'https://remote.example/n/1', target: CONTENT_URL })).status).toBe(404);
  });

  it('accepts a well-formed mention with 202 and stores it', async () => {
    const response = await form({ source: 'https://remote.example/n/1', target: CONTENT_URL });

    expect(response.status).toBe(202);
    expect(fetchMock).toHaveBeenCalledWith('https://remote.example/n/1', expect.any(Object));
    expect(db.saveRemoteContent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'comment', toUsername: 'alice', link: 'https://remote.example/n/1' })
    );
  });
});

describe('/api/social/follow', () => {
  it('GET renders a confirmation form posting back to the follow endpoint', async () => {
    const response = await get(q('/api/social/follow', 'https://remote.example/bob'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(html).toContain(
      `<form action="https://${HOST}/api/social/follow?resource=${encodeURIComponent('https://remote.example/bob')}" method="post">`
    );
  });

  it('POST 400s for an anonymous visitor', async () => {
    const response = await get(q('/api/social/follow', 'https://remote.example/bob'), { method: 'POST' });

    expect(response.status).toBe(400);
    expect(discover.discoverUserRemoteInfoSaveAndSubscribe).not.toHaveBeenCalled();
  });

  it('POST subscribes the signed-in user and redirects home', async () => {
    currentUser = user();
    const remote = userRemote();
    discover.discoverUserRemoteInfoSaveAndSubscribe.mockResolvedValue(remote);
    feeds.retrieveFeed.mockResolvedValue('<feed/>');

    const response = await get(q('/api/social/follow', remote.profileUrl), { method: 'POST' });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/');
    expect(discover.discoverUserRemoteInfoSaveAndSubscribe).toHaveBeenCalledWith(remote.profileUrl, 'alice');
    expect(feeds.parseFeedAndInsertIntoDb).toHaveBeenCalledWith(remote, '<feed/>');
  });

  it('POST still redirects home when discovery blows up', async () => {
    currentUser = user();
    discover.discoverUserRemoteInfoSaveAndSubscribe.mockRejectedValue(new Error('unreachable'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await get(q('/api/social/follow', 'https://remote.example/bob'), { method: 'POST' });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('POST skips the feed ingest when the remote user cannot be discovered', async () => {
    currentUser = user();
    discover.discoverUserRemoteInfoSaveAndSubscribe.mockResolvedValue(null);

    const response = await get(q('/api/social/follow', 'https://remote.example/bob'), { method: 'POST' });

    expect(response.status).toBe(302);
    expect(feeds.retrieveFeed).not.toHaveBeenCalled();
  });
});
