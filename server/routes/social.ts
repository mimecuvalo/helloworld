import { Hono } from 'hono';
import type { Context as HonoContext } from 'hono';
import crypto from 'crypto';
import forge from 'node-forge';
import magic from 'magic-signatures';
import type { AppEnv } from '../env';
import { CRON_SECRET } from '../config';
import packageJson from '../../package.json';
import { apUrl, buildUrl, contentUrl, profileUrl } from '../../lib/url-factory';
import { buildFeedContentSecurityPolicy } from '../../lib/security';
import { THUMB_HEIGHT, THUMB_WIDTH } from '../../util/constants';
import {
  getDefaultLocalUser,
  getLocalContent,
  getLocalContentByName,
  getLocalLatestContent,
  getLocalLatestContentByUsername,
  getLocalUser,
  getLocalUserByUsername,
  getRemoteAllUsers,
  getRemoteCommentsOnLocalContent,
  getRemoteCommentsOnLocalContentByName,
  getRemoteFollowing,
  getRemoteFriends,
  getRemoteUser,
  getReplyStatsForLocalContentName,
  getReplyStatsForLocalContents,
  countLocalUsersAndContent,
  getLocalUsersWithBluesky,
  removeOldRemoteContent,
} from '../social/db';
import { parseFeedAndInsertIntoDb, retrieveFeed } from '../social/feeds';
import { discoverUserRemoteInfoSaveAndSubscribe } from '../social/discover-user';
import { renderComments, renderFeed } from '../social/feed-xml';
import { renderRssFeed } from '../social/rss-xml';
import { renderFoaf } from '../social/foaf-xml';
import { renderOpml } from '../social/opml-xml';
import {
  ACTIVITY_JSON,
  accept,
  actorUrlFor,
  createActorObject,
  createNoteObject,
  ensureAssertionKey,
  findUserRemote,
  follow as activityStreamsFollow,
  followersUrlFor,
  followingUrlFor,
  handle,
  outboxUrlFor,
  refreshRemoteKey,
  repliesUrlFor,
  runDeliveryQueue,
} from '../social/activitystreams';
import { findMentions } from '../social/syndicate';
import { proofOf, verifyIntegrityProof } from '../social/integrity-proof';
import { handleMention } from '../social/webmention';
import {
  isAtprotoUserRemote,
  pollAtprotoUser,
  syncFollowersFromBluesky,
  syncProfileToBluesky,
} from '../social/atproto';
import type { UserRemote, User } from '../../generated/prisma/client';

function hostOf(c: HonoContext<AppEnv>) {
  return c.req.header('x-hw-host') || c.req.header('host') || '';
}

// The request path + query (used as the feed's self URL / signature target).
function reqPath(c: HonoContext<AppEnv>) {
  const u = new URL(c.req.url);
  return u.pathname + u.search;
}

// The Digest header is what ties the signature to the request *body*. A
// signature over `(request-target) host date` alone says nothing about what was
// posted, so an inbox that skips this check will happily accept a swapped
// payload from anyone who can replay a signed request line.
function verifyDigest(c: HonoContext<AppEnv>, rawBody: string): boolean {
  const header = c.req.header('digest') || c.req.header('content-digest') || '';
  if (!header) return false;

  // `Digest: SHA-256=<base64>`, possibly with more algorithms comma-separated.
  const sha256 = header
    .split(',')
    .map((part) => part.trim())
    .find((part) => /^sha-256=/i.test(part));
  if (!sha256) return false;

  const expected = crypto.createHash('sha256').update(rawBody, 'utf8').digest('base64');
  const actual = sha256.slice(sha256.indexOf('=') + 1).trim();
  const expectedBuffer = Buffer.from(expected, 'base64');
  const actualBuffer = Buffer.from(actual, 'base64');
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function verifyMessage(c: HonoContext<AppEnv>, userRemote: UserRemote, rawBody: string): boolean {
  try {
    const signatureMap: { [key: string]: string } = {};
    (c.req.header('signature') || '').split(',').forEach((keyValue) => {
      const pair = keyValue.split('=');
      signatureMap[pair[0]] = pair.slice(1).join('=').replace(/^"/, '').replace(/"$/, '');
    });

    const date = c.req.header('date') || '';
    if (Math.abs(Date.now() - new Date(date).getTime()) / 1000 > 60 * 5) {
      return false; // clock skew > 5 minutes
    }

    const signedHeaders = (signatureMap['headers'] || '').split(' ').filter(Boolean);
    // Refuse a signature that doesn't cover the body, even if it verifies:
    // otherwise the digest check above is trivially bypassed by omitting it.
    if (!signedHeaders.includes('digest')) return false;
    if (!verifyDigest(c, rawBody)) return false;

    const u = new URL(c.req.url);
    const requestTarget = u.pathname + u.search;
    const data = signedHeaders
      .map((header) =>
        header === '(request-target)' ? `(request-target): post ${requestTarget}` : `${header}: ${c.req.header(header)}`
      )
      .join('\n');

    const verify = crypto.createVerify('sha256');
    verify.write(data);
    verify.end();

    let publicKey = userRemote.magicKey || '';
    if (publicKey.startsWith('RSA.')) {
      publicKey = forge.pki.publicKeyToPem(magic.magicToRSA(userRemote.magicKey));
    }

    return verify.verify(publicKey, signatureMap['signature'], 'base64');
  } catch {
    return false;
  }
}

// How stale a proof may be and still be acted on.
//
// An HTTP signature has the Date header and a five-minute skew window to stop a
// replay. An object proof has neither — it's designed to stay valid while the
// activity is passed around — so a captured payload could otherwise be replayed
// at us forever. Generous, because a forward through a backed-up relay is
// legitimately slow, but not unbounded.
const PROOF_MAX_AGE_MS = 12 * 60 * 60 * 1000;

// A forwarded activity arrives over somebody else's HTTP signature: a relay's,
// or the instance passing it along. That signature is honestly theirs and says
// nothing about the author, which is why we reject these today. FEP-8b32 is the
// thing that makes them verifiable — the proof is over the activity itself and
// was made by the actor's own key.
async function verifyForwardedMessage(userRemote: UserRemote, body: unknown): Promise<boolean> {
  const proof = proofOf(body);
  if (!proof) return false;

  const created = new Date(proof.created).getTime();
  if (!Number.isFinite(created) || Date.now() - created > PROOF_MAX_AGE_MS) return false;

  // A key only speaks for this actor if the actor is the one publishing it. We
  // read it out of their actor document, so what's left to check is that the
  // method id didn't wander off to some other origin between then and now.
  const actorUrl = userRemote.activityPubActorUrl || userRemote.profileUrl;
  try {
    if (new URL(proof.verificationMethod).origin !== new URL(actorUrl).origin) return false;
  } catch {
    return false;
  }

  const publicKeyMultibase = await ensureAssertionKey(userRemote);
  return !!publicKeyMultibase && verifyIntegrityProof(body, publicKeyMultibase);
}

// Reads the request body once, as bytes, and parses it.
//
// The digest check needs exactly what was sent, so nothing may be parsed as an
// activity before the raw text has been captured.
async function readActivity(
  c: HonoContext<AppEnv>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ rawBody: string; body: any } | { error: 400 }> {
  const rawBody = await c.req.text();
  try {
    return { rawBody, body: JSON.parse(rawBody) };
  } catch {
    return { error: 400 };
  }
}

// Authenticates one activity for one local recipient and dispatches it.
//
// Either the request was signed by the actor (direct delivery), or the activity
// carries the actor's own FEP-8b32 proof (forwarded through a relay or another
// instance). Both are the actor vouching for these exact bytes.
async function acceptActivity(
  c: HonoContext<AppEnv>,
  host: string,
  user: User,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any,
  rawBody: string
): Promise<204 | 401> {
  let userRemote = await findUserRemote(body, user);
  if (!userRemote) {
    console.error('activitypub fail: ', body);
    return 401;
  }

  let verified = verifyMessage(c, userRemote, rawBody);

  // A signature that doesn't verify is also what a key rotation looks like from
  // this side. Re-read the peer's actor document once and try again, rather
  // than rejecting everything they ever send from here on.
  if (!verified && looksSignedBy(c, userRemote)) {
    const refreshed = await refreshRemoteKey(userRemote);
    if (refreshed) {
      userRemote = refreshed;
      verified = verifyMessage(c, userRemote, rawBody);
    }
  }

  if (!verified && !(await verifyForwardedMessage(userRemote, body))) return 401;

  await handle(body.type, host, body, user, userRemote);
  // An Accept belongs to a Follow, and it has to echo back the Follow itself —
  // this used to fire for every activity type, with the raw JSON string as the
  // object, which no implementation could match against its pending request.
  if (body.type === 'Follow') accept(host, user, userRemote, body);
  return 204;
}

// Whether the request carries a signature that at least *claims* to be this
// peer's. Gates the key refetch above so that POSTing junk at an inbox can't be
// used to make us fetch arbitrary actor documents on demand.
function looksSignedBy(c: HonoContext<AppEnv>, userRemote: UserRemote): boolean {
  const keyId = signatureParams(c)['keyId'];
  if (!keyId) return false;
  const actorUrl = userRemote.activityPubActorUrl || userRemote.profileUrl;
  try {
    return new URL(keyId).origin === new URL(actorUrl).origin;
  } catch {
    return false;
  }
}

// Which of our users an activity delivered to the shared inbox is for.
//
// Everything the activity addresses, matched against our own actor and
// followers URLs. A shared inbox has no user in its path, so this is the only
// thing that says who the delivery was meant for.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addressedLocalUsers(host: string, body: any): Promise<User[]> {
  const addressed = [body?.to, body?.cc, body?.bto, body?.bcc, body?.audience]
    .flat()
    .filter((value): value is string => typeof value === 'string');

  const origin = new URL(apUrl(host, 'x')).origin;
  const usernames = new Set<string>();
  for (const uri of addressed) {
    let url: URL;
    try {
      url = new URL(uri);
    } catch {
      continue;
    }
    if (url.origin !== origin) continue;
    // /ap/<username> and /ap/<username>/followers both name the same person.
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] !== 'ap' || !segments[1]) continue;
    if (segments.length > 2 && segments[2] !== 'followers') continue;
    usernames.add(decodeURIComponent(segments[1]));
  }

  const users = await Promise.all([...usernames].map((username) => getLocalUserByUsername(username)));
  return users.filter((user): user is User => !!user);
}

function signatureParams(c: HonoContext<AppEnv>): { [key: string]: string } {
  const params: { [key: string]: string } = {};
  (c.req.header('signature') || '').split(',').forEach((keyValue) => {
    const pair = keyValue.split('=');
    params[pair[0].trim()] = pair.slice(1).join('=').replace(/^"/, '').replace(/"$/, '');
  });
  return params;
}

// The peers a post mentions, resolved from what we already have on file.
//
// Deliberately DB-only. Delivery discovers unknown actors because it has to
// address them; serving an object must not turn a fetch of one post into a
// burst of outbound WebFinger lookups.
async function knownMentionsFor(localUsername: string, view: string, threadUser: string | null): Promise<UserRemote[]> {
  const urls = [...(threadUser ? [threadUser] : []), ...findMentions(view)];
  const resolved = await Promise.all(urls.map((url) => getRemoteUser(localUsername, url).catch(() => null)));

  const seen = new Set<string>();
  return resolved.filter((userRemote): userRemote is UserRemote => {
    if (!userRemote || seen.has(userRemote.profileUrl)) return false;
    seen.add(userRemote.profileUrl);
    return true;
  });
}

export const socialRoutes = new Hono<AppEnv>()
  // Cron: prune old remote content + pull fresh entries from every followed feed.
  // GET as well as POST: Vercel cron invokes the endpoint with a GET.
  .on(['GET', 'POST'], '/update-feeds', async (c) => {
    const auth = c.req.header('authorization');
    if (!import.meta.env.DEV && (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`)) {
      return c.json({ msg: 'i call shenanigans.' }, 400);
    }

    await removeOldRemoteContent();
    const usersRemote = await getRemoteAllUsers();
    for (const userRemote of usersRemote) {
      // A peer followed over AT Protocol has no Atom feed to fetch; poll their
      // author feed over XRPC instead.
      if (isAtprotoUserRemote(userRemote)) {
        await pollAtprotoUser(userRemote);
        continue;
      }

      let feedResponseText: string;
      try {
        feedResponseText = await retrieveFeed(userRemote.feedUrl);
      } catch {
        continue;
      }
      await parseFeedAndInsertIntoDb(userRemote, feedResponseText);
    }

    // Keep the linked Bluesky account in step: push profile changes out, pull
    // followers back in so they appear alongside fediverse followers.
    for (const localUser of await getLocalUsersWithBluesky()) {
      await syncProfileToBluesky(hostOf(c), localUser);
      await syncFollowersFromBluesky(localUser);
    }

    return c.json({ success: true });
  })

  // Cron: work through deliveries that couldn't be handed over first time.
  //
  // Separate from update-feeds because the useful cadence is completely
  // different — feeds are worth a daily pull, a queued delivery wants to go out
  // as soon as the far end is back. On a Vercel plan capped at one cron a day
  // this still beats the old behaviour, which was to lose the activity outright.
  .on(['GET', 'POST'], '/deliver-queue', async (c) => {
    const auth = c.req.header('authorization');
    if (!import.meta.env.DEV && (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`)) {
      return c.json({ msg: 'i call shenanigans.' }, 400);
    }

    return c.json(await runDeliveryQueue(hostOf(c)));
  })

  // host-meta: points to the WebFinger LRDD endpoint.
  .get('/.well-known/host-meta', (c) => {
    const host = hostOf(c);
    const webFingerUrl = buildUrl({ host, pathname: '/.well-known/webfinger' });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0" xmlns:hm="http://host-meta.net/xrd/1.0">
      <hm:Host>${buildUrl({ host, pathname: '' })}</hm:Host>
      <Link rel="lrdd" type="application/json" template="${webFingerUrl}?resource={uri}" />
      <Link rel="lrdd" type="application/xrd+xml" template="${webFingerUrl}?format=xml&amp;resource={uri}" />
    </XRD>`;
    return c.body(xml, 200, { 'Content-Type': 'application/xrd+xml' });
  })

  // WebFinger account discovery in JSON or legacy XRD/XML form.
  .get('/.well-known/webfinger', async (c) => {
    const host = hostOf(c);
    const resourceQ = c.req.query('resource') || '';
    const user = await getLocalUser(resourceQ);
    if (!user) return c.body(null, 404);
    if (c.req.query('format') === 'xml') {
      return c.body(webfingerXml(host, user), 200, { 'Content-Type': 'application/xrd+xml' });
    }
    return c.json(webfingerJson(host, user));
  })

  // NodeInfo discovery + document. This is how fediverse crawlers and instance
  // directories identify what software a host runs; Mastodon fetches it when it
  // first encounters a domain.
  .get('/.well-known/nodeinfo', (c) => {
    const host = hostOf(c);
    return c.json({
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
          href: buildUrl({ host, pathname: '/api/social/nodeinfo/2.1' }),
        },
      ],
    });
  })

  .get('/nodeinfo/2.1', async (c) => {
    const [users, posts] = await countLocalUsersAndContent();
    return c.body(
      JSON.stringify({
        version: '2.1',
        software: {
          name: 'helloworld',
          version: packageJson.version,
          repository: 'https://github.com/mimecuvalo/helloworld',
        },
        protocols: ['activitypub'],
        services: { inbound: ['atom1.0', 'rss2.0'], outbound: ['atom1.0', 'rss2.0'] },
        // Single-tenant blogs: accounts are provisioned, not signed up for.
        openRegistrations: false,
        usage: { users: { total: users }, localPosts: posts },
        metadata: {},
      }),
      200,
      { 'Content-Type': 'application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.1#"' }
    );
  })

  // oEmbed for a local content item.
  .get('/oembed', async (c) => {
    const host = hostOf(c);
    const resource = c.req.query('resource') || '';
    const contentOwner = await getLocalUser(resource);
    const content = await getLocalContent(resource);
    // getLocalContent does not constrain on hidden, and federation is
    // unauthenticated (no owner-viewing escape hatch), so guard it here.
    if (!contentOwner || !content || content.hidden) return c.body(null, 404);

    // An empty pathname would make buildUrl return the bare origin, which is
    // truthy and would be advertised as a THUMB_WIDTH x THUMB_HEIGHT image.
    const thumbPath = content.thumb || contentOwner.logo || contentOwner.favicon || '';
    const thumb = thumbPath ? buildUrl({ host, pathname: thumbPath }) : '';
    let htmlContent = thumb ? `<img src="${thumb}" alt="thumbnail" title="${content.title}" />` : content.title;
    const statsUrl = buildUrl({
      host,
      pathname: '/api/stats',
      searchParams: { resource: contentUrl(content, undefined, host) },
    });
    const statsImg = `<img src="${statsUrl}" alt="stats" />`;

    return c.json(
      {
        type: 'rich',
        version: '1.0',
        provider_url: buildUrl({ host, pathname: '/' }),
        title: content.title,
        author_name: content.username,
        author_url: profileUrl(contentOwner.username, host),
        provider_name: contentOwner.title || undefined,
        width: thumb ? THUMB_WIDTH : undefined,
        height: thumb ? THUMB_HEIGHT : undefined,
        thumbnail_width: thumb ? THUMB_WIDTH : undefined,
        thumbnail_height: thumb ? THUMB_HEIGHT : undefined,
        thumbnail_url: thumb || undefined,
        html: `<a href="${contentUrl(content, undefined, host)}">${htmlContent}</a>${statsImg}`,
      },
      200,
      { 'Content-Type': 'application/json+oembed' }
    );
  })

  // WebSub callback (pubsubhubbub) — still a no-op.
  .get('/websub', (c) => c.body(null, 200))
  .post('/websub', (c) => c.body(null, 200))

  // Atom feed (latest content).
  .get('/feed', async (c) => {
    const host = hostOf(c);
    const resource = c.req.query('resource') || '';
    const contentOwner = await getLocalUser(resource);
    if (!contentOwner) return c.body(null, 404);
    const feed = await getLocalLatestContent(resource);
    const replyStats = await getReplyStatsForLocalContents(
      contentOwner.username,
      feed.map((content) => content.name)
    );
    const xml = renderFeed(host, reqPath(c), feed, contentOwner, replyStats);
    // The feed is styled by /rss.xsl, which the app's strict CSP treats as script;
    // this response carries its own policy instead (see the api/$ mount for how it
    // survives the framework's header merge).
    return c.body(xml, 200, {
      'Content-Type': 'application/xml',
      'Cache-Control': `public, s-maxage=${60 * 60 * 24}`,
      'Content-Security-Policy': buildFeedContentSecurityPolicy(),
    });
  })

  // RSS 2.0 rendering of the same content as /feed, for plain-RSS readers.
  // Served as application/xml (not application/rss+xml) so browsers still apply
  // the /rss.xsl stylesheet; the discovery <link> carries the rss+xml type.
  .get('/rss', async (c) => {
    const host = hostOf(c);
    const resource = c.req.query('resource') || '';
    const contentOwner = await getLocalUser(resource);
    if (!contentOwner) return c.body(null, 404);
    const feed = await getLocalLatestContent(resource);
    return c.body(renderRssFeed(host, reqPath(c), feed, contentOwner), 200, {
      'Content-Type': 'application/xml',
      'Cache-Control': `public, s-maxage=${60 * 60 * 24}`,
      'Content-Security-Policy': buildFeedContentSecurityPolicy(),
    });
  })

  // The blogroll as OPML — everyone this user follows, for import into a feed
  // reader. Unlike its siblings, `resource` is optional: reached without one
  // (the pretty /blogs.opml.xml route) it answers for the site's default user.
  .get('/opml', async (c) => {
    const host = hostOf(c);
    const resource = c.req.query('resource') || '';
    const user = resource ? await getLocalUser(resource) : await getDefaultLocalUser(host);
    if (!user) return c.body(null, 404);
    const following = await getRemoteFollowing(user.username);
    return c.body(renderOpml(host, user, following), 200, {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${60 * 60}`,
    });
  })

  // Atom feed of remote comments on a local item.
  .get('/comments', async (c) => {
    const host = hostOf(c);
    const resource = c.req.query('resource') || '';
    const contentOwner = await getLocalUser(resource);
    if (!contentOwner) return c.body(null, 404);
    const comments = await getRemoteCommentsOnLocalContent(resource);
    return c.body(renderComments(host, reqPath(c), resource, comments, contentOwner), 200, {
      'Content-Type': 'application/xml',
    });
  })

  // FOAF (friends) RDF document.
  .get('/foaf', async (c) => {
    const host = hostOf(c);
    const resource = c.req.query('resource') || '';
    const user = await getLocalUser(resource);
    if (!user) return c.body(null, 404);
    const [followers, following] = await getRemoteFriends(resource);
    return c.body(renderFoaf(host, user, followers, following), 200, { 'Content-Type': 'application/xrd+xml' });
  })

  // The ActivityPub surface, at /ap/* rather than under /api — see apUrl in
  // lib/url-factory for why, and app/routes/ap/$.ts for the rewrite that gets
  // requests here.
  //
  // The shared inbox is registered before /ap/:username so that a site with a
  // user called "inbox" doesn't shadow it.
  .post('/ap/inbox', async (c) => {
    const host = hostOf(c);
    const raw = await readActivity(c);
    if ('error' in raw) return c.body(null, raw.error);

    // Nobody is named in the URL, so the recipients are whoever the activity
    // itself addresses. An activity that turns out to address none of our users
    // is accepted and dropped: it isn't an error on the sender's part, and
    // saying so would leak which accounts exist here.
    const recipients = await addressedLocalUsers(host, raw.body);
    for (const user of recipients) {
      await acceptActivity(c, host, user, raw.body, raw.rawBody);
    }
    return c.body(null, 202);
  })

  // The actor document.
  .get('/ap/:username', async (c) => {
    const host = hostOf(c);
    const user = await getLocalUserByUsername(c.req.param('username'));
    if (!user) return c.body(null, 404);

    return c.body(JSON.stringify(await createActorObject(host, user)), 200, {
      'Content-Type': ACTIVITY_JSON,
      'Cache-Control': `public, s-maxage=${60 * 5}`,
    });
  })

  // A user's own inbox. Same handling as the shared one, minus the guesswork
  // about who it is for.
  .post('/ap/:username/inbox', async (c) => {
    const host = hostOf(c);
    const user = await getLocalUserByUsername(c.req.param('username'));
    if (!user) return c.body(null, 404);

    const raw = await readActivity(c);
    if ('error' in raw) return c.body(null, raw.error);

    const status = await acceptActivity(c, host, user, raw.body, raw.rawBody);
    return c.body(null, status);
  })

  // The actor's collections. Each is an OrderedCollection that points at its
  // first page; `?page=1` returns the page itself. Mastodon walks these to show
  // follower counts and to backfill a newly-followed account's posts.
  .get('/ap/:username/outbox', async (c) => {
    const host = hostOf(c);
    const user = await getLocalUserByUsername(c.req.param('username'));
    if (!user) return c.body(null, 404);

    // getLocalLatestContentByUsername already excludes hidden items —
    // federation is unauthenticated, so nothing non-public may appear here.
    const feed = await getLocalLatestContentByUsername(user.username);
    const collectionUrl = outboxUrlFor(host, user);

    if (!c.req.query('page')) {
      return activityJson(c, collectionOf(collectionUrl, feed.length));
    }

    // One grouped query for the whole page: every Note inlines its reply count,
    // and asking per item would be 50 round trips to build one response.
    const replyStats = await getReplyStatsForLocalContents(
      user.username,
      feed.map((content) => content.name)
    );
    const items = await Promise.all(
      feed.map(async (content) => {
        const object = await createNoteObject(host, content, user, replyStats[content.name]);
        return {
          type: 'Create',
          id: `${object.id}#create`,
          actor: actorUrlFor(host, user),
          published: object.published,
          to: object.to,
          cc: object.cc,
          object,
        };
      })
    );
    return activityJson(c, pageOf(collectionUrl, items));
  })

  .get('/ap/:username/followers', (c) => actorCollection(c, 'followers'))
  .get('/ap/:username/following', (c) => actorCollection(c, 'following'))

  // The AS2 document for one local post.
  .get('/ap/:username/o/:name', async (c) => {
    const host = hostOf(c);
    const username = c.req.param('username');
    const name = c.req.param('name');
    const [user, content] = await Promise.all([
      getLocalUserByUsername(username),
      getLocalContentByName(username, name),
    ]);
    if (!user || !content || content.hidden) return c.body(null, 404);

    const json = await createNoteObject(
      host,
      content,
      user,
      await getReplyStatsForLocalContentName(username, name),
      await knownMentionsFor(username, content.view, content.threadUser)
    );
    return activityJson(c, { '@context': 'https://www.w3.org/ns/activitystreams', ...json });
  })

  // The replies to one local post — the ActivityPub half of what Atom has
  // advertised as <link rel="replies"> since the OStatus days.
  .get('/ap/:username/o/:name/replies', async (c) => {
    const host = hostOf(c);
    const username = c.req.param('username');
    const name = c.req.param('name');
    const content = await getLocalContentByName(username, name);
    if (!content || content.hidden) return c.body(null, 404);

    const collectionUrl = repliesUrlFor(host, content);

    if (!c.req.query('page')) {
      const { count } = await getReplyStatsForLocalContentName(username, name);
      return activityJson(c, collectionOf(collectionUrl, count));
    }

    const comments = await getRemoteCommentsOnLocalContentByName(username, name);
    const items = comments.map((comment) => comment.postId || comment.link).filter(Boolean);
    return activityJson(c, pageOf(collectionUrl, items));
  })
  // Salmon endpoint (OStatus; verifies the magic-envelope signature).
  .post('/salmon', async (c) => {
    const host = hostOf(c);
    const resource = c.req.query('resource') || '';
    if (!resource) return c.body(null, 400);
    const user = await getLocalUser(resource);
    if (!user) return c.body(null, 404);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await c.req.json()) as any;
    const activityPubJSON = JSON.parse(magic.b64utob(body.data).toString('utf8'));
    const userRemote = await findUserRemote(activityPubJSON, user);
    if (!userRemote) {
      console.error('salmon fail: ', activityPubJSON);
      return c.body(null, 401);
    }
    try {
      magic.verify(body, userRemote.magicKey);
    } catch {
      return c.body(null, 401);
    }
    await handle(activityPubJSON.type, host, activityPubJSON, user, userRemote);
    return c.body(null, 204);
  })

  // Inbound WebMention.
  .post('/webmention', async (c) => {
    const resource = c.req.query('resource') || '';
    const form = await c.req.parseBody();
    const source = form.source as string;
    const target = form.target as string;
    if (!resource || !source || !target) return c.body(null, 400);
    const user = await getLocalUser(resource);
    if (!user) return c.body(null, 404);
    await handleMention(user, source, target);
    return c.body(null, 202);
  })

  // OStatus remote-follow: GET confirm page, POST performs the follow.
  .get('/follow', (c) => {
    const resource = c.req.query('resource') || '';
    const actionUrl = buildUrl({ host: hostOf(c), pathname: '/api/social/follow', searchParams: { resource } });
    return c.html(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Confirm follow request</title></head><body><h1>Confirm Follow</h1><form action="${actionUrl}" method="post"><button type="submit">Follow</button></form></body></html>`
    );
  })
  .post('/follow', async (c) => {
    const ctx = c.get('ctx');
    if (!ctx.currentUser) return c.body(null, 400);
    const resource = c.req.query('resource') || '';
    try {
      const userRemote = await discoverUserRemoteInfoSaveAndSubscribe(resource, ctx.currentUser.username);
      if (userRemote && isAtprotoUserRemote(userRemote)) {
        await pollAtprotoUser(userRemote);
      } else if (userRemote) {
        const feedText = await retrieveFeed(userRemote.feedUrl);
        await parseFeedAndInsertIntoDb(userRemote, feedText);
        activityStreamsFollow(hostOf(c), ctx.currentUser, userRemote, true);
      }
    } catch (ex) {
      console.error(ex);
    }
    return c.redirect('/');
  });

function activityJson(c: HonoContext<AppEnv>, body: unknown) {
  return c.body(JSON.stringify(body), 200, { 'Content-Type': ACTIVITY_JSON });
}

function collectionOf(collectionUrl: string, totalItems: number) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: collectionUrl,
    type: 'OrderedCollection',
    totalItems,
    first: `${collectionUrl}?page=1`,
  };
}

function pageOf(collectionUrl: string, orderedItems: unknown[]) {
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${collectionUrl}?page=1`,
    type: 'OrderedCollectionPage',
    partOf: collectionUrl,
    totalItems: orderedItems.length,
    orderedItems,
  };
}

// followers/following differ only in which half of getRemoteFriends they read.
async function actorCollection(c: HonoContext<AppEnv>, which: 'followers' | 'following') {
  const host = hostOf(c);
  const user = await getLocalUserByUsername(c.req.param('username') || '');
  if (!user) return c.body(null, 404);

  const [followers, following] = await getRemoteFriends(user.username);
  // Prefer the peer's actor id; profileUrl is the fallback discovery stores.
  const actors = (which === 'followers' ? followers : following).map(
    (peer) => peer.activityPubActorUrl || peer.profileUrl
  );
  const collectionUrl = which === 'followers' ? followersUrlFor(host, user) : followingUrlFor(host, user);

  return activityJson(
    c,
    c.req.query('page') ? pageOf(collectionUrl, actors) : collectionOf(collectionUrl, actors.length)
  );
}

// WebFinger JSON document (Mastodon et al).
function webfingerJson(host: string, user: User) {
  const resource = profileUrl(user.username, host);
  const account = `acct:${user.username}@${host}`;
  const sp = { resource };
  const url = (pathname: string) => buildUrl({ host, pathname, searchParams: sp });
  const logo = buildUrl({ host, pathname: user.logo || user.favicon || '' });

  return {
    subject: account,
    aliases: [resource],
    links: [
      {
        rel: 'http://schemas.google.com/g/2010#updates-from',
        type: 'application/atom+xml',
        href: url('/api/social/feed'),
      },
      { rel: 'alternate', type: 'application/rss+xml', href: url('/api/social/rss') },
      { rel: 'http://webfinger.net/rel/profile-page', type: 'text/html', href: resource },
      { rel: 'http://webfinger.net/rel/avatar', type: 'image/jpeg', href: logo },
      { rel: 'salmon', href: url('/api/social/salmon') },
      { rel: 'http://salmon-protocol.org/ns/salmon-replies', href: url('/api/social/salmon') },
      { rel: 'http://salmon-protocol.org/ns/salmon-mention', href: url('/api/social/salmon') },
      { rel: 'http://ostatus.org/schema/1.0/subscribe', href: url('/api/social/follow') },
      { rel: 'webmention', href: url('/api/social/webmention') },
      { rel: 'magic-public-key', href: `data:application/magic-public-key,${user.magicKey}` },
      { rel: 'describedby', type: 'application/rdf+xml', href: url('/api/social/foaf') },
      { rel: 'describedby', type: 'application/json', href: url('/api/social/.well-known/webfinger') },
      { rel: 'http://microformats.org/profile/hcard', type: 'text/html', href: resource },
      { rel: 'self', type: 'application/activity+json', href: actorUrlFor(host, user) },
    ],
  };
}

function escapeXml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function webfingerXml(host: string, user: User): string {
  const document = webfingerJson(host, user);
  const links = document.links
    .map((link) => {
      const attributes = Object.entries(link)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}="${escapeXml(value)}"`)
        .join(' ');
      return `<Link ${attributes} />`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0"><Subject>${escapeXml(document.subject)}</Subject>${document.aliases.map((alias) => `<Alias>${escapeXml(alias)}</Alias>`).join('')}${links}</XRD>`;
}
