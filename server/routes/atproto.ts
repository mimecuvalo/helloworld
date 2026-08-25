import { Hono } from 'hono';
import type { Context as HonoContext } from 'hono';
import type { AppEnv } from '../env';
import type { Content, User } from '../../generated/prisma/client';
import { buildUrl, profileUrl } from '../../lib/url-factory';
import { getLocalLatestContent } from '../social/db';
import prisma from '../prisma';
import { buildDidDocument, canHaveDid, didForUser } from '../social/atproto-identity';
import { POST_COLLECTION, recordFor, rkeyFor } from '../social/atproto-records';

// The AT Protocol read surface, mounted at /xrpc/* (see app/routes/xrpc/$.ts —
// atproto clients address `<pds>/xrpc/<nsid>`, so it has to sit at the root).
//
// SCOPE: this is a read-only projection of the blog into atproto's data model.
// It is NOT a Personal Data Server. There are no signed repo commits, no MST,
// no com.atproto.sync.* — so relays will not index this and the Bluesky appview
// will not resolve it as a real repo host. What it gives you is a legible
// atproto identity (did:web) and records anything speaking the lexicon can read
// directly. Actual two-way Bluesky interop goes through the bridge in
// server/social/atproto.ts.

function hostOf(c: HonoContext<AppEnv>) {
  return c.req.header('x-hw-host') || c.req.header('host') || '';
}

// XRPC errors are `{ error, message }` with a matching status.
function xrpcError(c: HonoContext<AppEnv>, status: 400 | 404 | 501, error: string, message: string) {
  return c.json({ error, message }, status);
}

// `repo` may be the DID we minted for the user, their handle, or the bare
// username — resolve all three back to a local user.
async function resolveLocalRepo(host: string, repo: string): Promise<User | null> {
  if (!repo) return null;

  if (repo.startsWith('did:web:')) {
    const segments = repo.slice('did:web:'.length).split(':');
    const username = segments.length > 1 ? decodeURIComponent(segments[segments.length - 1]) : null;
    if (username) return await prisma.user.findUnique({ where: { username } });
    // did:web:<domain> — the user who owns that domain.
    return await prisma.user.findUnique({ where: { hostname: decodeURIComponent(segments[0]) } });
  }

  // alice.example.com -> alice; a bare `alice` works too.
  const username = repo.includes('.') ? repo.split('.')[0] : repo;
  return await prisma.user.findUnique({ where: { username } });
}

function handleFor(host: string, user: User): string {
  return user.hostname === host ? host : `${user.username}.${host}`;
}

async function postViewFor(host: string, did: string, user: User, content: Content) {
  const record = await recordFor(host, did, content, user);
  return {
    uri: record.uri,
    cid: record.cid,
    author: {
      did,
      handle: handleFor(host, user),
      displayName: user.name,
      avatar: user.logo ? buildUrl({ host, pathname: user.logo }) : undefined,
    },
    record: record.value,
    replyCount: content.commentsCount,
    repostCount: 0,
    likeCount: content.favoritesCount,
    indexedAt: new Date(content.updatedAt || content.createdAt || Date.now()).toISOString(),
  };
}

export const atprotoRoutes = new Hono<AppEnv>()
  // did:web document. Served at /.well-known/did.json for a user on their own
  // domain, and at /<username>/did.json for everyone on the shared host.
  .get('/did.json', async (c) => {
    const host = hostOf(c);
    if (!canHaveDid(host)) return c.body(null, 404);

    const username = c.req.query('username') || '';
    const user = username
      ? await prisma.user.findUnique({ where: { username } })
      : await prisma.user.findUnique({ where: { hostname: host } });
    if (!user) return c.body(null, 404);

    const document = await buildDidDocument(host, user);
    // No signing key provisioned yet means no atproto identity to publish.
    if (!document) return c.body(null, 404);

    return c.json(document, 200, { 'Cache-Control': `public, s-maxage=${60 * 60}` });
  })

  // Handle resolution: a bare DID, as text/plain.
  .get('/atproto-did', async (c) => {
    const host = hostOf(c);
    if (!canHaveDid(host)) return c.body(null, 404);

    const username = c.req.query('username') || '';
    const user = username
      ? await prisma.user.findUnique({ where: { username } })
      : await prisma.user.findUnique({ where: { hostname: host } });
    if (!user || !user.atprotoSigningKey) return c.body(null, 404);

    return c.body(didForUser(host, user), 200, { 'Content-Type': 'text/plain; charset=utf-8' });
  })

  .get('/com.atproto.repo.describeRepo', async (c) => {
    const host = hostOf(c);
    const user = await resolveLocalRepo(host, c.req.query('repo') || '');
    if (!user) return xrpcError(c, 400, 'RepoNotFound', 'Could not find repo');
    if (!canHaveDid(host)) return xrpcError(c, 400, 'InvalidRequest', 'This host cannot serve a did:web identity');

    const did = didForUser(host, user);
    return c.json({
      handle: handleFor(host, user),
      did,
      didDoc: await buildDidDocument(host, user),
      collections: [POST_COLLECTION],
      // did:web is domain-anchored, so the handle is correct by construction.
      handleIsCorrect: true,
    });
  })

  .get('/com.atproto.repo.listRecords', async (c) => {
    const host = hostOf(c);
    const user = await resolveLocalRepo(host, c.req.query('repo') || '');
    if (!user) return xrpcError(c, 400, 'RepoNotFound', 'Could not find repo');

    const collection = c.req.query('collection') || '';
    if (collection !== POST_COLLECTION) {
      return xrpcError(c, 400, 'InvalidRequest', `Unknown collection: ${collection}`);
    }

    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '50', 10) || 50, 1), 100);
    const did = didForUser(host, user);
    // getLocalLatestContent already excludes hidden items.
    const feed = await getLocalLatestContent(profileUrl(user.username, host));
    const records = await Promise.all(
      feed.slice(0, limit).map(async (content) => {
        const { uri, cid, value } = await recordFor(host, did, content, user);
        return { uri, cid, value };
      })
    );

    return c.json({ records });
  })

  .get('/com.atproto.repo.getRecord', async (c) => {
    const host = hostOf(c);
    const user = await resolveLocalRepo(host, c.req.query('repo') || '');
    if (!user) return xrpcError(c, 400, 'RepoNotFound', 'Could not find repo');
    if (c.req.query('collection') !== POST_COLLECTION) {
      return xrpcError(c, 400, 'InvalidRequest', 'Unknown collection');
    }

    // Record keys are TIDs, not post slugs, so this resolves by matching the
    // key each post derives rather than by looking the name up directly.
    const rkey = c.req.query('rkey') || '';
    const feed = await getLocalLatestContent(profileUrl(user.username, host));
    const content = feed.find((item) => rkeyFor(item) === rkey);
    // The federation surface is unauthenticated: hidden means invisible.
    if (!content || content.hidden || content.username !== user.username) {
      return xrpcError(c, 404, 'RecordNotFound', 'Could not locate record');
    }

    const { uri, cid, value } = await recordFor(host, didForUser(host, user), content, user);
    return c.json({ uri, cid, value });
  })

  .get('/app.bsky.actor.getProfile', async (c) => {
    const host = hostOf(c);
    const user = await resolveLocalRepo(host, c.req.query('actor') || '');
    if (!user) return xrpcError(c, 400, 'InvalidRequest', 'Profile not found');

    const feed = await getLocalLatestContent(profileUrl(user.username, host));
    return c.json({
      did: didForUser(host, user),
      handle: handleFor(host, user),
      displayName: user.name,
      description: user.description || undefined,
      avatar: user.logo ? buildUrl({ host, pathname: user.logo }) : undefined,
      postsCount: feed.length,
      followersCount: 0,
      followsCount: 0,
      indexedAt: new Date(user.updatedAt || Date.now()).toISOString(),
    });
  })

  .get('/app.bsky.feed.getAuthorFeed', async (c) => {
    const host = hostOf(c);
    const user = await resolveLocalRepo(host, c.req.query('actor') || '');
    if (!user) return xrpcError(c, 400, 'InvalidRequest', 'Actor not found');

    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '50', 10) || 50, 1), 100);
    const did = didForUser(host, user);
    const feed = await getLocalLatestContent(profileUrl(user.username, host));
    const posts = await Promise.all(
      feed.slice(0, limit).map(async (content) => ({ post: await postViewFor(host, did, user, content) }))
    );

    return c.json({ feed: posts });
  })

  // Anything else in the lexicon: say so plainly rather than 404ing as if the
  // route were wrong. This is a read-only projection, not a PDS.
  .all('/*', (c) =>
    xrpcError(
      c,
      501,
      'MethodNotImplemented',
      'This host serves a read-only AT Protocol projection; it is not a Personal Data Server.'
    )
  );
