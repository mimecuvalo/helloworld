import crypto from 'node:crypto';
import magic from 'magic-signatures';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  getDefaultLocalUser: vi.fn(),
  getLocalContent: vi.fn(),
  getLocalLatestContent: vi.fn(),
  getLocalUser: vi.fn(),
  getRemoteAllUsers: vi.fn(),
  getRemoteCommentsOnLocalContent: vi.fn(),
  getRemoteContent: vi.fn(),
  getRemoteFollowing: vi.fn(),
  getRemoteFriends: vi.fn(),
  getReplyStatsForLocalContent: vi.fn(),
  getReplyStatsForLocalContents: vi.fn(),
  ensureEd25519Key: vi.fn(),
  getRemoteUser: vi.fn(),
  getRemoteUserByActor: vi.fn(),
  countLocalUsersAndContent: vi.fn(),
  getLocalUsersWithBluesky: vi.fn(),
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
import { addIntegrityProof, generateEd25519Key, withProofContext } from 'server/social/integrity-proof';
import { HOST, content, contentRemote, keys, proofKeys, user, userRemote } from './fixtures';

const ALICE_PROFILE = `https://${HOST}/alice`;
const CONTENT_URL = `https://${HOST}/alice/blog/hello`;
const repliesUrl = (resource: string) =>
  `https://${HOST}/api/social/activitypub/replies?resource=${encodeURIComponent(resource)}`;

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
  db.getRemoteFollowing.mockResolvedValue([]);
  db.getDefaultLocalUser.mockResolvedValue(user());
  db.getRemoteAllUsers.mockResolvedValue([]);
  db.countLocalUsersAndContent.mockResolvedValue([1, 1]);
  db.getLocalUsersWithBluesky.mockResolvedValue([]);
  db.getReplyStatsForLocalContent.mockResolvedValue({ count: 0, updated: null });
  db.getReplyStatsForLocalContents.mockResolvedValue({});
  db.ensureEd25519Key.mockImplementation(async (u: ReturnType<typeof user>) => u.ed25519PrivateKey || '');
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
    expect(rel(links, 'alternate')).toMatchObject({
      type: 'application/rss+xml',
      href: `https://${HOST}/api/social/rss?resource=${encodeURIComponent(ALICE_PROFILE)}`,
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

  it('ships a policy that lets the browser load the /rss.xsl stylesheet', async () => {
    // Chrome treats an XSLT stylesheet as script, and the app-wide policy's
    // 'strict-dynamic' disables both host allowlisting and 'self' — so the feed
    // carries its own nonce-free policy (a nonce can't ride on a processing
    // instruction, and this response is CDN-cached anyway).
    const csp = (await get(q('/api/social/feed'))).headers.get('content-security-policy');

    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain('strict-dynamic');
    expect(csp).not.toContain('nonce-');
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

describe('GET /api/social/rss', () => {
  it('404s for an unknown user', async () => {
    db.getLocalUser.mockResolvedValue(null);

    expect((await get(q('/api/social/rss'))).status).toBe(404);
    expect(db.getLocalLatestContent).not.toHaveBeenCalled();
  });

  it('serves an RSS 2.0 feed of the same content as /feed', async () => {
    const response = await get(q('/api/social/rss'));

    expect(response.status).toBe(200);
    const doc = parseXml(await response.text());
    expect(doc.documentElement.tagName).toBe('rss');
    expect(doc.querySelectorAll('item')).toHaveLength(1);
    expect(db.getLocalLatestContent).toHaveBeenCalledWith(ALICE_PROFILE);
  });

  it('is served as application/xml so the browser still applies /rss.xsl', async () => {
    // application/rss+xml suppresses XSLT rendering in some browsers; the
    // rss+xml type is advertised on the discovery <link> instead.
    const response = await get(q('/api/social/rss'));

    expect(response.headers.get('content-type')).toContain('application/xml');
    expect(response.headers.get('content-type')).not.toContain('rss+xml');
  });

  it('ships the same stylesheet-friendly policy and CDN caching as the Atom feed', async () => {
    const response = await get(q('/api/social/rss'));

    expect(response.headers.get('content-security-policy')).toContain("script-src 'self'");
    expect(response.headers.get('cache-control')).toBe('public, s-maxage=86400');
  });

  it('sets the self link to the full request path including the query', async () => {
    const doc = parseXml(await (await get(q('/api/social/rss'))).text());

    expect(doc.querySelector('channel > link[rel="self"]')?.getAttribute('href')).toBe(
      `https://${HOST}${q('/api/social/rss')}`
    );
  });

  it('honors the x-hw-host header for multi-tenant hosting', async () => {
    const response = await get(q('/api/social/rss'), { headers: { 'x-hw-host': 'tenant.example' } });
    const doc = parseXml(await response.text());

    expect(doc.querySelector('channel > link[rel="self"]')?.getAttribute('href')).toContain('https://tenant.example/');
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

describe('GET /api/social/opml', () => {
  it('serves the blogroll as OPML', async () => {
    db.getRemoteFollowing.mockResolvedValue([userRemote()]);

    const response = await get(q('/api/social/opml'));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/xml');
    expect(db.getLocalUser).toHaveBeenCalledWith(ALICE_PROFILE);
    expect(db.getRemoteFollowing).toHaveBeenCalledWith('alice');

    const doc = parseXml(await response.text());
    expect(doc.documentElement.tagName).toBe('opml');
    expect(doc.querySelector('body outline outline')?.getAttribute('xmlUrl')).toBe('https://remote.example/bob/feed');
  });

  it('404s for an unknown user', async () => {
    db.getLocalUser.mockResolvedValue(null);

    expect((await get(q('/api/social/opml'))).status).toBe(404);
    expect(db.getRemoteFollowing).not.toHaveBeenCalled();
  });

  it('answers for the default user when no resource is given', async () => {
    const response = await get('/api/social/opml');

    expect(response.status).toBe(200);
    expect(db.getDefaultLocalUser).toHaveBeenCalledWith(HOST);
    expect(db.getLocalUser).not.toHaveBeenCalled();
    expect(db.getRemoteFollowing).toHaveBeenCalledWith('alice');
  });

  it('404s when the site has no default user', async () => {
    db.getDefaultLocalUser.mockResolvedValue(null);

    expect((await get('/api/social/opml')).status).toBe(404);
  });

  it('is CDN-cached, since a blogroll changes only when a follow does', async () => {
    expect((await get(q('/api/social/opml'))).headers.get('cache-control')).toBe('public, s-maxage=3600');
  });

  it('honors the x-hw-host header for multi-tenant hosting', async () => {
    const response = await get('/api/social/opml', { headers: { 'x-hw-host': 'tenant.example' } });
    const doc = parseXml(await response.text());

    expect(db.getDefaultLocalUser).toHaveBeenCalledWith('tenant.example');
    expect(doc.querySelector('ownerId')?.textContent).toBe('https://tenant.example/alice');
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

    expect(body['@context']).toEqual([
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
      // Data Integrity terms, so a peer that resolves contexts doesn't drop the
      // Multikey in assertionMethod or the proof on an activity.
      'https://w3id.org/security/data-integrity/v1',
      'https://w3id.org/security/multikey/v1',
    ]);
    expect(body).toMatchObject({
      type: 'Person',
      preferredUsername: 'alice',
      url: ALICE_PROFILE,
      id: `https://${HOST}/api/social/activitypub/actor?resource=${encodeURIComponent(ALICE_PROFILE)}`,
      inbox: `https://${HOST}/api/social/activitypub/inbox?resource=${encodeURIComponent(ALICE_PROFILE)}`,
    });
    expect(body.publicKey).toMatchObject({ id: `${body.id}#main-key`, owner: body.id });
  });

  it('advertises the collections and shared inbox Mastodon walks', async () => {
    const response = await get(q('/api/social/activitypub/actor'));
    const body = await response.json();
    const url = (path: string) => `https://${HOST}${path}?resource=${encodeURIComponent(ALICE_PROFILE)}`;

    expect(response.headers.get('content-type')).toContain('application/activity+json');
    expect(body).toMatchObject({
      name: 'Alice A',
      summary: 'a site',
      manuallyApprovesFollowers: false,
      discoverable: true,
      outbox: url('/api/social/activitypub/outbox'),
      followers: url('/api/social/activitypub/followers'),
      following: url('/api/social/activitypub/following'),
      endpoints: { sharedInbox: url('/api/social/activitypub/inbox') },
      icon: { type: 'Image', url: `https://${HOST}/favicon.jpg` },
    });
  });

  it('exports the magic key as a PEM peers can verify signatures with', async () => {
    db.getLocalUser.mockResolvedValue(user({ magicKey: magic.RSAToMagic(keys().publicKey) }));

    const body = await (await get(q('/api/social/activitypub/actor'))).json();

    expect(body.publicKey.publicKeyPem.replace(/\r/g, '').trim()).toBe(keys().publicKey.trim());
  });

  it('publishes an Ed25519 Multikey in assertionMethod for FEP-8b32 proofs', async () => {
    db.getLocalUser.mockResolvedValue(user({ ed25519PrivateKey: proofKeys().privateKeyPem }));

    const body = await (await get(q('/api/social/activitypub/actor'))).json();

    expect(body.assertionMethod).toEqual([
      {
        id: `${body.id}#ed25519-key`,
        type: 'Multikey',
        controller: body.id,
        publicKeyMultibase: proofKeys().publicKeyMultibase,
      },
    ]);
    // Distinct from the RSA key: that one signs HTTP requests, this one objects.
    expect(body.publicKey.id).toBe(`${body.id}#main-key`);
  });

  it('mints the Ed25519 key on first publication for a user created before proofs existed', async () => {
    db.getLocalUser.mockResolvedValue(user({ ed25519PrivateKey: null }));
    db.ensureEd25519Key.mockResolvedValue(proofKeys().privateKeyPem);

    const body = await (await get(q('/api/social/activitypub/actor'))).json();

    expect(db.ensureEd25519Key).toHaveBeenCalled();
    expect(body.assertionMethod[0].publicKeyMultibase).toBe(proofKeys().publicKeyMultibase);
  });

  it('still serves the RSA half of the actor when the Ed25519 key cannot be read', async () => {
    db.ensureEd25519Key.mockResolvedValue('not-a-pem');

    const response = await get(q('/api/social/activitypub/actor'));

    expect(response.status).toBe(200);
    expect((await response.json()).assertionMethod).toBeUndefined();
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

  it('returns the bare Note object, not the Create wrapper', async () => {
    const response = await get(q('/api/social/activitypub/message', CONTENT_URL));
    const body = await response.json();

    expect(response.headers.get('content-type')).toContain('application/activity+json');
    expect(body).toMatchObject({
      type: 'Note',
      url: CONTENT_URL,
      title: 'Hello',
      attributedTo: expect.stringContaining('/api/social/activitypub/actor'),
      to: ['https://www.w3.org/ns/activitystreams#Public'],
    });
    // A standalone object still needs its own context; only the Create wrapper is gone.
    expect(body['@context']).toBe('https://www.w3.org/ns/activitystreams');
    expect(body.object).toBeUndefined();
  });

  it('inlines a replies collection so a client sees the count without another fetch', async () => {
    db.getReplyStatsForLocalContent.mockResolvedValue({
      count: 3,
      updated: new Date('2026-03-01T00:00:00.000Z'),
    });

    const body = await (await get(q('/api/social/activitypub/message', CONTENT_URL))).json();

    expect(body.replies).toEqual({
      id: repliesUrl(CONTENT_URL),
      type: 'OrderedCollection',
      totalItems: 3,
      updated: '2026-03-01T00:00:00.000Z',
      first: `${repliesUrl(CONTENT_URL)}&page=1`,
    });
  });

  it('says zero rather than omitting the collection when nothing has replied', async () => {
    const body = await (await get(q('/api/social/activitypub/message', CONTENT_URL))).json();

    expect(body.replies).toMatchObject({ totalItems: 0, type: 'OrderedCollection' });
  });
});

describe('GET /api/social/activitypub/replies', () => {
  const path = q('/api/social/activitypub/replies', CONTENT_URL);

  it('404s when the item or its owner is unknown', async () => {
    db.getLocalContent.mockResolvedValue(null);
    expect((await get(path)).status).toBe(404);

    db.getLocalContent.mockResolvedValue(content());
    db.getLocalUser.mockResolvedValue(null);
    expect((await get(path)).status).toBe(404);
  });

  it('404s for a hidden item, which must not confirm it exists', async () => {
    db.getLocalContent.mockResolvedValue(content({ hidden: true }));

    expect((await get(path)).status).toBe(404);
    expect(db.getRemoteCommentsOnLocalContent).not.toHaveBeenCalled();
  });

  it('returns an OrderedCollection pointing at its first page', async () => {
    db.getReplyStatsForLocalContent.mockResolvedValue({ count: 2, updated: null });

    const response = await get(path);
    const body = await response.json();

    expect(response.headers.get('content-type')).toContain('application/activity+json');
    expect(body.type).toBe('OrderedCollection');
    expect(body.totalItems).toBe(2);
    expect(body.first).toBe(`${body.id}&page=1`);
    // The count comes from one grouped query, not from loading every comment.
    expect(db.getRemoteCommentsOnLocalContent).not.toHaveBeenCalled();
  });

  it('lists the repliers own object ids, so clients resolve each at its home instance', async () => {
    db.getRemoteCommentsOnLocalContent.mockResolvedValue([
      contentRemote({ postId: 'https://remote.example/bob/1' }),
      contentRemote({ postId: 'https://two.example/carol/9' }),
    ]);

    const body = await (await get(`${path}&page=1`)).json();

    expect(body.type).toBe('OrderedCollectionPage');
    expect(body.partOf).toBe(repliesUrl(CONTENT_URL));
    expect(body.orderedItems).toEqual(['https://remote.example/bob/1', 'https://two.example/carol/9']);
  });

  it('falls back to the link when a stored reply has no post id', async () => {
    db.getRemoteCommentsOnLocalContent.mockResolvedValue([
      contentRemote({ postId: '', link: 'https://remote.example/bob/1' }),
    ]);

    expect((await (await get(`${path}&page=1`)).json()).orderedItems).toEqual(['https://remote.example/bob/1']);
  });
});

describe('actor collections', () => {
  const followerOne = () =>
    userRemote({ id: 1, profileUrl: 'https://one.example/bob', activityPubActorUrl: 'https://one.example/users/bob' });
  const followerTwo = () => userRemote({ id: 2, profileUrl: 'https://two.example/carol', activityPubActorUrl: null });

  it('404s for an unknown user', async () => {
    db.getLocalUser.mockResolvedValue(null);

    expect((await get(q('/api/social/activitypub/outbox'))).status).toBe(404);
    expect((await get(q('/api/social/activitypub/followers'))).status).toBe(404);
    expect((await get(q('/api/social/activitypub/following'))).status).toBe(404);
  });

  it('returns an OrderedCollection pointing at its first page', async () => {
    db.getRemoteFriends.mockResolvedValue([[followerOne(), followerTwo()], []]);
    const body = await (await get(q('/api/social/activitypub/followers'))).json();

    expect(body.type).toBe('OrderedCollection');
    expect(body.totalItems).toBe(2);
    expect(body.first).toBe(`${body.id}&page=1`);
    expect(body.orderedItems).toBeUndefined();
  });

  it('returns the actors themselves on the page, preferring the actor id', async () => {
    db.getRemoteFriends.mockResolvedValue([[followerOne(), followerTwo()], []]);
    const body = await (await get(`${q('/api/social/activitypub/followers')}&page=1`)).json();

    expect(body.type).toBe('OrderedCollectionPage');
    expect(body.orderedItems).toEqual(['https://one.example/users/bob', 'https://two.example/carol']);
  });

  it('reads following from the other half of getRemoteFriends', async () => {
    db.getRemoteFriends.mockResolvedValue([[followerOne()], [followerTwo()]]);
    const body = await (await get(`${q('/api/social/activitypub/following')}&page=1`)).json();

    expect(body.orderedItems).toEqual(['https://two.example/carol']);
  });

  it('wraps each outbox item in a Create carrying the Note', async () => {
    const body = await (await get(`${q('/api/social/activitypub/outbox')}&page=1`)).json();

    expect(body.type).toBe('OrderedCollectionPage');
    expect(body.orderedItems).toHaveLength(1);
    expect(body.orderedItems[0]).toMatchObject({
      type: 'Create',
      actor: expect.stringContaining('/api/social/activitypub/actor'),
      object: { type: 'Note', title: 'Hello' },
    });
  });

  it('serves collections as activity+json', async () => {
    const response = await get(q('/api/social/activitypub/outbox'));

    expect(response.headers.get('content-type')).toContain('application/activity+json');
  });
});

describe('nodeinfo', () => {
  it('points discovery at the 2.1 document', async () => {
    const body = await (await get('/api/social/.well-known/nodeinfo')).json();

    expect(body.links).toEqual([
      {
        rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
        href: `https://${HOST}/api/social/nodeinfo/2.1`,
      },
    ]);
  });

  it('describes the software, its protocols and its usage', async () => {
    db.countLocalUsersAndContent.mockResolvedValue([3, 42]);

    const response = await get('/api/social/nodeinfo/2.1');
    const body = await response.json();

    expect(response.headers.get('content-type')).toContain('nodeinfo.diaspora.software/ns/schema/2.1');
    expect(body).toMatchObject({
      version: '2.1',
      software: { name: 'helloworld' },
      protocols: ['activitypub'],
      openRegistrations: false,
      usage: { users: { total: 3 }, localPosts: 42 },
    });
    expect(body.software.version).toBeTruthy();
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

  // Signs the way Mastodon does: the digest is what binds the signature to the
  // body, so it is part of both the header set and the signing string.
  function signedHeaders(date = new Date(), target = path, body: unknown = activity) {
    const serialized = JSON.stringify(body);
    const digest = `SHA-256=${crypto.createHash('sha256').update(serialized, 'utf8').digest('base64')}`;
    const contentType = 'application/activity+json';
    const signable = [
      `(request-target): post ${target}`,
      `host: ${HOST}`,
      `date: ${date.toUTCString()}`,
      `digest: ${digest}`,
      `content-type: ${contentType}`,
    ].join('\n');
    const signer = crypto.createSign('sha256');
    signer.update(signable);
    signer.end();
    const signature = signer.sign(keys().privateKeyPkcs1).toString('base64');
    return {
      headers: {
        'content-type': contentType,
        date: date.toUTCString(),
        digest,
        signature: `keyId="k#main-key",headers="(request-target) host date digest content-type",signature="${signature}"`,
      },
      body: serialized,
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

  it('401s when the body does not match the signed digest', async () => {
    // The whole point of the digest: a valid signature over a swapped body.
    const signed = signedHeaders();
    signed.body = JSON.stringify({ ...activity, actor: 'https://attacker.example/users/eve' });

    expect((await post(signed)).status).toBe(401);
    expect(db.saveRemoteUser).not.toHaveBeenCalled();
  });

  it('401s when the digest header is missing', async () => {
    const signed = signedHeaders();
    signed.headers.digest = '';

    expect((await post(signed)).status).toBe(401);
  });

  it('401s when the signature does not cover the digest at all', async () => {
    // A signature over only `(request-target) host date` says nothing about the
    // body, so it must be refused even though it verifies on its own terms.
    const date = new Date();
    const signable = `(request-target): post ${path}\nhost: ${HOST}\ndate: ${date.toUTCString()}`;
    const signer = crypto.createSign('sha256');
    signer.update(signable);
    signer.end();
    const signature = signer.sign(keys().privateKeyPkcs1).toString('base64');
    const body = JSON.stringify(activity);

    const response = await post({
      headers: {
        'content-type': 'application/activity+json',
        date: date.toUTCString(),
        digest: `SHA-256=${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}`,
        signature: `keyId="k",headers="(request-target) host date",signature="${signature}"`,
      },
      body,
    });

    expect(response.status).toBe(401);
  });

  it('400s on a body that is not JSON at all', async () => {
    const signed = signedHeaders();

    expect((await post({ ...signed, body: 'not json' })).status).toBe(400);
  });

  it('401s when the signature header is missing entirely', async () => {
    const signed = signedHeaders();
    signed.headers.signature = '';

    expect((await post(signed)).status).toBe(401);
  });

  // Everything below is the FEP-8b32 half: an activity that reaches us
  // second-hand, over an HTTP signature belonging to whoever forwarded it.
  describe('forwarded payloads', () => {
    const { privateKeyPem, publicKeyMultibase } = proofKeys();

    const digestOf = (body: string) => `SHA-256=${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}`;

    // A signature from the forwarding instance, which we cannot verify against
    // the actor — exactly the case that used to 401 unconditionally.
    const relayHeaders = (body: string) => ({
      'content-type': 'application/activity+json',
      date: new Date().toUTCString(),
      digest: digestOf(body),
      signature:
        'keyId="https://relay.example/actor#main-key",headers="(request-target) host date digest content-type",signature="cmVsYXk="',
    });

    function proofed(options: { key?: string; verificationMethod?: string; created?: string } = {}) {
      const document = addIntegrityProof(
        { ...activity, '@context': withProofContext(activity['@context']) },
        {
          verificationMethod: options.verificationMethod || 'https://remote.example/users/bob#ed25519-key',
          privateKeyPem: options.key || privateKeyPem,
          created: options.created,
        }
      );
      const body = JSON.stringify(document);
      return { headers: relayHeaders(body), body };
    }

    beforeEach(() => {
      db.getRemoteUserByActor.mockResolvedValue(
        userRemote({ magicKey: keys().publicKey, ed25519PublicKey: publicKeyMultibase })
      );
    });

    it('accepts a forwarded activity carrying the actors own proof', async () => {
      const response = await post(proofed());

      expect(response.status).toBe(204);
      expect(db.saveRemoteUser).toHaveBeenCalledWith(expect.objectContaining({ follower: true }));
    });

    it('401s when the forwarder edited the activity in flight', async () => {
      const tampered = proofed();
      const document = JSON.parse(tampered.body);
      document.actor = 'https://attacker.example/users/eve';
      tampered.body = JSON.stringify(document);
      tampered.headers.digest = digestOf(tampered.body);

      expect((await post(tampered)).status).toBe(401);
    });

    it('401s when the proof was made by a key the actor does not publish', async () => {
      expect((await post(proofed({ key: generateEd25519Key().privateKeyPem }))).status).toBe(401);
    });

    it('401s when the verification method belongs to another origin', async () => {
      // The proof verifies on its own terms; the key just is not one this actor
      // is entitled to speak with.
      const response = await post(proofed({ verificationMethod: 'https://attacker.example/actor#ed25519-key' }));

      expect(response.status).toBe(401);
    });

    it('401s on a stale proof, since nothing else bounds a replay of one', async () => {
      const created = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      expect((await post(proofed({ created }))).status).toBe(401);
    });

    it('401s on an unproofed activity forwarded by someone else', async () => {
      const body = JSON.stringify(activity);

      expect((await post({ headers: relayHeaders(body), body })).status).toBe(401);
    });

    it('fetches the actor document for a peer discovered before we stored their key', async () => {
      db.getRemoteUserByActor.mockResolvedValue(userRemote({ magicKey: keys().publicKey, ed25519PublicKey: null }));
      discover.getActivityPubActor.mockResolvedValue({
        assertionMethod: [{ type: 'Multikey', id: 'k', publicKeyMultibase }],
      });

      expect((await post(proofed())).status).toBe(204);
      expect(discover.getActivityPubActor).toHaveBeenCalledWith('https://remote.example/users/bob');
      expect(db.saveRemoteUser).toHaveBeenCalledWith(expect.objectContaining({ ed25519PublicKey: publicKeyMultibase }));
    });

    it('does not go fetch an actor document when there is no proof to check', async () => {
      db.getRemoteUserByActor.mockResolvedValue(userRemote({ magicKey: keys().publicKey, ed25519PublicKey: null }));
      const signed = signedHeaders();
      signed.headers.signature = signed.headers.signature.replace(/signature="[^"]+"/, 'signature="bogus"');

      expect((await post(signed)).status).toBe(401);
      expect(discover.getActivityPubActor).not.toHaveBeenCalled();
    });
  });

  it('accepts a signed Follow, records the follower and returns 204', async () => {
    const response = await post(signedHeaders());

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(db.saveRemoteUser).toHaveBeenCalledWith(expect.objectContaining({ follower: true }));
  });

  it('sends an Accept back to the follower inbox, echoing the Follow', async () => {
    db.getRemoteUserByActor.mockResolvedValue(
      userRemote({ magicKey: keys().publicKey, activityPubInboxUrl: 'https://remote.example/inbox' })
    );
    db.getLocalUser.mockResolvedValue(user({ privateKey: keys().privateKeyPkcs1 }));

    await post(signedHeaders());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledWith('https://remote.example/inbox', expect.any(Object));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ type: 'Accept', object: activity });
  });

  it('does not send an Accept for activities that are not a Follow', async () => {
    db.getRemoteContent.mockResolvedValue(null);
    db.getRemoteUserByActor.mockResolvedValue(
      userRemote({ magicKey: keys().publicKey, activityPubInboxUrl: 'https://remote.example/inbox' })
    );
    const note = {
      ...activity,
      type: 'Create',
      object: { id: 'https://remote.example/notes/1', type: 'Note', content: '<p>hi</p>' },
    };

    await post(signedHeaders(new Date(), path, note));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).not.toHaveBeenCalled();
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
