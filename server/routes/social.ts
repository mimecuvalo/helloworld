import { Hono } from 'hono';
import type { Context as HonoContext } from 'hono';
import crypto from 'crypto';
import forge from 'node-forge';
import magic from 'magic-signatures';
import type { AppEnv } from '../env';
import { CRON_SECRET } from '../config';
import { buildUrl, contentUrl, profileUrl } from '../../lib/url-factory';
import { THUMB_HEIGHT, THUMB_WIDTH } from '../../util/constants';
import {
  getLocalContent,
  getLocalLatestContent,
  getLocalUser,
  getRemoteAllUsers,
  getRemoteCommentsOnLocalContent,
  getRemoteFriends,
  removeOldRemoteContent,
} from '../social/db';
import { parseFeedAndInsertIntoDb, retrieveFeed } from '../social/feeds';
import { discoverUserRemoteInfoSaveAndSubscribe } from '../social/discover-user';
import { renderComments, renderFeed } from '../social/feed-xml';
import { renderFoaf } from '../social/foaf-xml';
import {
  accept,
  createArticle,
  findUserRemote,
  follow as activityStreamsFollow,
  handle,
} from '../social/activitystreams';
import { handleMention } from '../social/webmention';
import type { UserRemote, User } from '../../generated/prisma/client';

function hostOf(c: HonoContext<AppEnv>) {
  return c.req.header('x-hw-host') || c.req.header('host') || '';
}

// The request path + query (used as the feed's self URL / signature target).
function reqPath(c: HonoContext<AppEnv>) {
  const u = new URL(c.req.url);
  return u.pathname + u.search;
}

function verifyMessage(c: HonoContext<AppEnv>, userRemote: UserRemote): boolean {
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

    const u = new URL(c.req.url);
    const requestTarget = u.pathname + u.search;
    const data = signatureMap['headers']
      .split(' ')
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

export const socialRoutes = new Hono<AppEnv>()
  // Cron: prune old remote content + pull fresh entries from every followed feed.
  .post('/update-feeds', async (c) => {
    const auth = c.req.header('authorization');
    if (!import.meta.env.DEV && auth !== `Bearer ${CRON_SECRET}`) {
      return c.json({ msg: 'i call shenanigans.' }, 400);
    }

    await removeOldRemoteContent();
    const usersRemote = await getRemoteAllUsers();
    for (const userRemote of usersRemote) {
      let feedResponseText: string;
      try {
        feedResponseText = await retrieveFeed(userRemote.feedUrl);
      } catch {
        continue;
      }
      await parseFeedAndInsertIntoDb(userRemote, feedResponseText);
    }
    return c.json({ success: true });
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

  // oEmbed for a local content item.
  .get('/oembed', async (c) => {
    const host = hostOf(c);
    const resource = c.req.query('resource') || '';
    const contentOwner = await getLocalUser(resource);
    const content = await getLocalContent(resource);
    if (!contentOwner || !content) return c.body(null, 404);

    const thumb = buildUrl({ host, pathname: content.thumb || contentOwner.logo || contentOwner.favicon || '' });
    let htmlContent = thumb ? `<img src="${thumb}" alt="thumbnail" title="${content.title}" />` : content.title;
    htmlContent = htmlContent.replace(/</g, '<').replace(/>/g, '>');
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
    const xml = renderFeed(host, reqPath(c), feed, contentOwner);
    return c.body(xml, 200, { 'Content-Type': 'application/xml', 'Cache-Control': `public, s-maxage=${60 * 60 * 24}` });
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

  // ActivityPub actor document.
  .get('/activitypub/actor', async (c) => {
    const host = hostOf(c);
    const resource = c.req.query('resource') || '';
    const user = await getLocalUser(resource);
    if (!user) return c.body(null, 404);
    const actorUrl = buildUrl({ host, pathname: '/api/social/activitypub/actor', searchParams: { resource } });
    const inboxUrl = buildUrl({ host, pathname: '/api/social/activitypub/inbox', searchParams: { resource } });
    let publicKeyPem = '';
    try {
      publicKeyPem = forge.pki.publicKeyToPem(magic.magicToRSA(user.magicKey));
    } catch {
      // user has no magic key yet
    }
    return c.json({
      '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],
      id: actorUrl,
      type: 'Person',
      preferredUsername: user.username,
      inbox: inboxUrl,
      url: profileUrl(user.username, host),
      publicKey: { id: `${actorUrl}#main-key`, owner: actorUrl, publicKeyPem },
    });
  })

  // ActivityPub Article object for a local item.
  .get('/activitypub/message', async (c) => {
    const host = hostOf(c);
    const resource = c.req.query('resource') || '';
    const content = await getLocalContent(resource);
    const user = await getLocalUser(resource);
    if (!content || !user) return c.body(null, 404);
    const json = (await createArticle(host, content, user)).object;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return c.json(json as any);
  })

  // ActivityPub inbox (verifies the HTTP signature, dispatches the activity).
  .post('/activitypub/inbox', async (c) => {
    const host = hostOf(c);
    const resource = c.req.query('resource') || '';
    if (!resource) return c.body(null, 400);
    const user = await getLocalUser(resource);
    if (!user) return c.body(null, 404);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await c.req.json()) as any;
    const userRemote = await findUserRemote(body, user);
    if (!userRemote) {
      console.error('activitypub fail: ', body);
      return c.body(null, 401);
    }
    if (!verifyMessage(c, userRemote)) return c.body(null, 401);

    await handle(body.type, host, body, user, userRemote);
    accept(host, user, userRemote, JSON.stringify(body));
    return c.body(null, 204);
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
      if (userRemote) {
        const feedText = await retrieveFeed(userRemote.feedUrl);
        await parseFeedAndInsertIntoDb(userRemote, feedText);
        activityStreamsFollow(hostOf(c), ctx.currentUser, userRemote, true);
      }
    } catch (ex) {
      console.error(ex);
    }
    return c.redirect('/');
  });

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
      { rel: 'http://webfinger.net/rel/profile-page', type: 'text/html', href: resource },
      { rel: 'http://webfinger.net/rel/avatar', type: 'image/jpeg', href: logo },
      { rel: 'salmon', href: url('/api/social/salmon') },
      { rel: 'http://salmon-protocol.org/ns/salmon-replies', href: url('/api/social/salmon') },
      { rel: 'http://salmon-protocol.org/ns/salmon-mention', href: url('/api/social/salmon') },
      { rel: 'http://ostatus.org/schema/1.0/subscribe', href: url('/api/social/follow') },
      { rel: 'webmention', href: url('/api/social/webmention') },
      { rel: 'magic-public-key', href: `data:application/magic-public-key,${user.magicKey}` },
      { rel: 'describedby', type: 'application/rdf+xml', href: url('/api/social/foaf') },
      { rel: 'describedby', type: 'application/json', href: url('/api/social/webfinger') },
      { rel: 'http://microformats.org/profile/hcard', type: 'text/html', href: resource },
      { rel: 'self', type: 'application/activity+json', href: url('/api/social/activitypub/actor') },
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
