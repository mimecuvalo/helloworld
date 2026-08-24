import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  getLocalContent: vi.fn(),
  getLocalLatestContent: vi.fn(),
  getLocalUser: vi.fn(),
}));
const prismaMock = vi.hoisted(() => ({ default: { user: { findUnique: vi.fn() } } }));

vi.mock('server/social/db', () => db);
vi.mock('server/prisma', () => prismaMock);
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

import type { AppEnv } from 'server/env';
import { atprotoRoutes } from 'server/routes/atproto';
import { generateSigningKey } from 'server/social/atproto-identity';
import { HOST, content, user } from './fixtures';

const DID = `did:web:${HOST}:alice`;

// Mirrors the /xrpc/* rewrite in app/routes/xrpc/$.ts.
function get(path: string, host = HOST) {
  const app = new Hono<AppEnv>().basePath('/api').route('/atproto', atprotoRoutes);
  return app.request(`http://${host}${path}`, { headers: { host } });
}

let signingKey: string;

beforeEach(async () => {
  vi.clearAllMocks();
  if (!signingKey) signingKey = (await generateSigningKey()).privateKeyHex;
  prismaMock.default.user.findUnique.mockResolvedValue(user({ atprotoSigningKey: signingKey }));
  db.getLocalLatestContent.mockResolvedValue([content()]);
  db.getLocalContent.mockResolvedValue(content());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('did:web document', () => {
  it('publishes the document for a user on the shared host', async () => {
    const response = await get('/api/atproto/did.json?username=alice');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe(DID);
    expect(body.alsoKnownAs).toEqual([`at://alice.${HOST}`]);
    expect(body.service[0]).toMatchObject({ type: 'AtprotoPersonalDataServer', serviceEndpoint: `https://${HOST}` });
  });

  it('404s for a user with no signing key provisioned yet', async () => {
    prismaMock.default.user.findUnique.mockResolvedValue(user({ atprotoSigningKey: null }));

    expect((await get('/api/atproto/did.json?username=alice')).status).toBe(404);
  });

  it('404s on a host that cannot have a did:web at all', async () => {
    // A port can't appear in a did:web, so localhost dev has no identity.
    expect((await get('/api/atproto/did.json?username=alice', 'localhost:3000')).status).toBe(404);
  });

  it('serves the bare DID as text for handle resolution', async () => {
    const response = await get('/api/atproto/atproto-did?username=alice');

    expect(response.headers.get('content-type')).toContain('text/plain');
    await expect(response.text()).resolves.toBe(DID);
  });
});

describe('com.atproto.repo.describeRepo', () => {
  it('describes the repo, its handle and its collections', async () => {
    const body = await (await get(`/api/atproto/com.atproto.repo.describeRepo?repo=${DID}`)).json();

    expect(body).toMatchObject({
      did: DID,
      handle: `alice.${HOST}`,
      collections: ['app.bsky.feed.post'],
      handleIsCorrect: true,
    });
    expect(body.didDoc.id).toBe(DID);
  });

  it('accepts a handle or a bare username as the repo', async () => {
    await expect(
      (await get(`/api/atproto/com.atproto.repo.describeRepo?repo=alice.${HOST}`)).json()
    ).resolves.toMatchObject({ did: DID });
    await expect((await get('/api/atproto/com.atproto.repo.describeRepo?repo=alice')).json()).resolves.toMatchObject({
      did: DID,
    });
  });

  it('returns an XRPC error for an unknown repo', async () => {
    prismaMock.default.user.findUnique.mockResolvedValue(null);

    const response = await get('/api/atproto/com.atproto.repo.describeRepo?repo=nobody');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'RepoNotFound' });
  });
});

describe('com.atproto.repo.listRecords', () => {
  it('lists posts as app.bsky.feed.post records with real CIDs', async () => {
    const body = await (
      await get(`/api/atproto/com.atproto.repo.listRecords?repo=${DID}&collection=app.bsky.feed.post`)
    ).json();

    expect(body.records).toHaveLength(1);
    expect(body.records[0].uri).toBe(`at://${DID}/app.bsky.feed.post/hello`);
    expect(body.records[0].cid.startsWith('bafyrei')).toBe(true);
    expect(body.records[0].value).toMatchObject({ $type: 'app.bsky.feed.post' });
  });

  it('rejects a collection it does not carry', async () => {
    const response = await get(
      `/api/atproto/com.atproto.repo.listRecords?repo=${DID}&collection=app.bsky.graph.follow`
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'InvalidRequest' });
  });

  it('caps the limit at 100', async () => {
    db.getLocalLatestContent.mockResolvedValue(Array.from({ length: 50 }, () => content()));

    const body = await (
      await get(`/api/atproto/com.atproto.repo.listRecords?repo=${DID}&collection=app.bsky.feed.post&limit=9999`)
    ).json();

    expect(body.records.length).toBeLessThanOrEqual(100);
  });
});

describe('com.atproto.repo.getRecord', () => {
  it('returns one record', async () => {
    const body = await (
      await get(`/api/atproto/com.atproto.repo.getRecord?repo=${DID}&collection=app.bsky.feed.post&rkey=hello`)
    ).json();

    expect(body.uri).toBe(`at://${DID}/app.bsky.feed.post/hello`);
    expect(body.value.$type).toBe('app.bsky.feed.post');
  });

  it('never returns a hidden post', async () => {
    // The whole XRPC surface is unauthenticated, same as the feeds.
    db.getLocalContent.mockResolvedValue(content({ hidden: true }));

    const response = await get(
      `/api/atproto/com.atproto.repo.getRecord?repo=${DID}&collection=app.bsky.feed.post&rkey=hello`
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: 'RecordNotFound' });
  });

  it("never returns another user's post", async () => {
    db.getLocalContent.mockResolvedValue(content({ username: 'bob' }));

    expect(
      (await get(`/api/atproto/com.atproto.repo.getRecord?repo=${DID}&collection=app.bsky.feed.post&rkey=hello`)).status
    ).toBe(404);
  });
});

describe('app.bsky views', () => {
  it('renders a profile', async () => {
    const body = await (await get(`/api/atproto/app.bsky.actor.getProfile?actor=${DID}`)).json();

    expect(body).toMatchObject({ did: DID, handle: `alice.${HOST}`, displayName: 'Alice A', postsCount: 1 });
  });

  it('renders an author feed of post views', async () => {
    const body = await (await get(`/api/atproto/app.bsky.feed.getAuthorFeed?actor=${DID}`)).json();

    expect(body.feed).toHaveLength(1);
    expect(body.feed[0].post).toMatchObject({
      uri: `at://${DID}/app.bsky.feed.post/hello`,
      author: { did: DID, handle: `alice.${HOST}` },
    });
  });
});

describe('the rest of the lexicon', () => {
  it('says plainly that this is not a PDS rather than 404ing', async () => {
    const response = await get('/api/atproto/com.atproto.sync.subscribeRepos');

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toMatchObject({ error: 'MethodNotImplemented' });
  });
});
