import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ getRemoteUser: vi.fn(), saveRemoteUser: vi.fn() }));
vi.mock('server/social/db', () => db);

import {
  discoverUserRemoteInfoSaveAndSubscribe,
  getActivityPubActor,
  getHTML,
  getLRDD,
  getUserRemoteInfo,
  getWebfinger,
} from 'server/social/discover-user';
import { userRemote } from './fixtures';

const HOST_META_JSON = `<?xml version="1.0"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" type="application/xrd+xml" template="https://remote.example/webfinger.xml?resource={uri}" />
  <Link rel="lrdd" type="application/json" template="https://remote.example/.well-known/webfinger?resource={uri}" />
</XRD>`;

const WEBFINGER_JSON = JSON.stringify({
  subject: 'acct:bob@remote.example',
  aliases: ['acct:bob@remote.example', 'https://remote.example/bob'],
  links: [
    { rel: 'http://schemas.google.com/g/2010#updates-from', href: 'https://remote.example/bob/feed' },
    { rel: 'salmon', href: 'https://remote.example/salmon' },
    { rel: 'webmention', href: 'https://remote.example/webmention' },
    { rel: 'magic-public-key', href: 'data:application/magic-public-key,RSA.abc.AQAB' },
    { rel: 'self', type: 'application/activity+json', href: 'https://remote.example/users/bob' },
  ],
});

const ATOM_FEED = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:poco="http://portablecontacts.net/spec/1.0">
  <title>Bob's blog</title>
  <link rel="hub" href="https://hub.example/" />
  <link rel="salmon" href="https://remote.example/atom-salmon" />
  <author>
    <uri>https://remote.example/bob</uri>
    <poco:preferredusername>bobby</poco:preferredusername>
    <poco:displayname>Bob B</poco:displayname>
  </author>
  <entry><title>A post</title><link href="https://remote.example/bob/1"/><id>https://remote.example/bob/1</id></entry>
</feed>`;

const HTML_PAGE = `<html><head>
  <link rel="alternate" type="application/atom+xml" href="/bob/feed" />
  <link rel="webmention" href="https://remote.example/wm" />
</head><body></body></html>`;

// Route fetches by url so each test can describe the remote server it is talking to.
let routes: Record<string, () => Response>;
let fetchMock: ReturnType<typeof vi.fn>;

function serve(url: string, body: string, contentType = 'text/plain') {
  routes[url] = () => new Response(body, { status: 200, headers: { 'content-type': contentType } });
}

beforeEach(() => {
  routes = {};
  fetchMock = vi.fn(async (url: string) => {
    const route = routes[String(url)];
    if (!route) return new Response('not found', { status: 404 });
    return route();
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getLRDD', () => {
  it('prefers the JSON lrdd template from host-meta', async () => {
    serve('https://remote.example/.well-known/host-meta', HOST_META_JSON, 'application/xrd+xml');

    await expect(getLRDD('https://remote.example/bob')).resolves.toBe(
      'https://remote.example/.well-known/webfinger?resource={uri}'
    );
  });

  it('probes host-meta at the origin of the profile url, not the profile path', async () => {
    serve('https://remote.example/.well-known/host-meta', HOST_META_JSON, 'application/xrd+xml');

    await getLRDD('https://remote.example/deep/path/bob?x=1');

    expect(fetchMock).toHaveBeenCalledWith('https://remote.example/.well-known/host-meta', expect.any(Object));
  });

  it('falls back to any lrdd template when there is no JSON one', async () => {
    serve(
      'https://remote.example/.well-known/host-meta',
      `<XRD><Link rel="lrdd" type="application/xrd+xml" template="https://remote.example/wf.xml?resource={uri}"/></XRD>`,
      'application/xrd+xml'
    );

    await expect(getLRDD('https://remote.example/bob')).resolves.toBe('https://remote.example/wf.xml?resource={uri}');
  });

  it('returns undefined when the site has no host-meta', async () => {
    await expect(getLRDD('https://remote.example/bob')).resolves.toBeUndefined();
  });
});

describe('getWebfinger', () => {
  const lrdd = 'https://remote.example/.well-known/webfinger?resource={uri}';
  const wfUrl = (uri: string) => lrdd.replace('{uri}', encodeURIComponent(uri));

  it('maps the JSON link rels onto the remote user fields', async () => {
    serve(wfUrl('https://remote.example/bob'), WEBFINGER_JSON, 'application/jrd+json');

    await expect(getWebfinger(lrdd, 'https://remote.example/bob')).resolves.toEqual({
      feedUrl: 'https://remote.example/bob/feed',
      salmonUrl: 'https://remote.example/salmon',
      webmentionUrl: 'https://remote.example/webmention',
      activityPubActorUrl: 'https://remote.example/users/bob',
      magicKey: 'RSA.abc.AQAB',
      profileUrl: 'https://remote.example/bob',
    });
  });

  it('skips the acct: alias and keeps the http(s) profile url', async () => {
    serve(wfUrl('https://remote.example/bob'), WEBFINGER_JSON, 'application/jrd+json');

    const info = await getWebfinger(lrdd, 'https://remote.example/bob');

    expect(info?.profileUrl).toBe('https://remote.example/bob');
  });

  it('retries as username@hostname when the url form 404s', async () => {
    serve(wfUrl('bob@remote.example'), WEBFINGER_JSON, 'application/jrd+json');

    const info = await getWebfinger(lrdd, 'https://remote.example/bob');

    expect(info?.feedUrl).toBe('https://remote.example/bob/feed');
    expect(fetchMock.mock.calls.map((call) => call[0]).slice(0, 2)).toEqual([
      wfUrl('https://remote.example/bob'),
      wfUrl('bob@remote.example'),
    ]);
  });

  it('returns null when neither webfinger form resolves', async () => {
    await expect(getWebfinger(lrdd, 'https://remote.example/bob')).resolves.toBeNull();
  });

  it('parses a legacy XRD document when the response is not JSON', async () => {
    serve(
      wfUrl('https://remote.example/bob'),
      `<?xml version="1.0"?><XRD><Alias>acct:bob@remote.example</Alias><Alias>https://remote.example/bob</Alias>
       <Link rel="http://schemas.google.com/g/2010#updates-from" href="https://remote.example/bob/feed"/>
       <Link rel="salmon" href="https://remote.example/salmon"/>
       <Link rel="webmention" href="https://remote.example/webmention"/>
       <Link rel="magic-public-key" href="data:application/magic-public-key,RSA.xyz.AQAB"/></XRD>`,
      'application/xrd+xml'
    );

    const info = await getWebfinger(lrdd, 'https://remote.example/bob');

    expect(info).toMatchObject({
      feedUrl: 'https://remote.example/bob/feed',
      salmonUrl: 'https://remote.example/salmon',
      webmentionUrl: 'https://remote.example/webmention',
      magicKey: 'RSA.xyz.AQAB',
    });
  });

  it('prefers the actor PEM key and inbox over the webfinger magic key', async () => {
    serve(wfUrl('https://remote.example/bob'), WEBFINGER_JSON, 'application/jrd+json');
    serve(
      'https://remote.example/users/bob',
      JSON.stringify({
        inbox: 'https://remote.example/users/bob/inbox',
        publicKey: { publicKeyPem: '-----BEGIN PUBLIC KEY-----\nMII\n-----END PUBLIC KEY-----\n' },
      }),
      'application/activity+json'
    );

    const info = await getWebfinger(lrdd, 'https://remote.example/bob');

    expect(info?.magicKey).toContain('BEGIN PUBLIC KEY');
    expect(info?.activityPubInboxUrl).toBe('https://remote.example/users/bob/inbox');
  });

  it('keeps the webfinger data when the actor document is unreachable', async () => {
    serve(wfUrl('https://remote.example/bob'), WEBFINGER_JSON, 'application/jrd+json');

    const info = await getWebfinger(lrdd, 'https://remote.example/bob');

    expect(info?.magicKey).toBe('RSA.abc.AQAB');
    expect(info?.activityPubActorUrl).toBe('https://remote.example/users/bob');
  });
});

describe('getActivityPubActor', () => {
  it('asks for activity+json', async () => {
    serve('https://remote.example/users/bob', '{"id":"x"}', 'application/activity+json');

    await expect(getActivityPubActor('https://remote.example/users/bob')).resolves.toEqual({ id: 'x' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://remote.example/users/bob',
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/activity+json' }) })
    );
  });

  it('propagates an http error rather than returning a partial actor', async () => {
    await expect(getActivityPubActor('https://remote.example/users/bob')).rejects.toThrow();
  });
});

describe('getHTML', () => {
  it('returns a cheerio document for a reachable page', async () => {
    serve('https://remote.example/bob', HTML_PAGE, 'text/html');

    const $ = await getHTML('https://remote.example/bob');

    expect($!('link[rel="webmention"]').attr('href')).toBe('https://remote.example/wm');
  });

  it('returns null when the page cannot be fetched', async () => {
    await expect(getHTML('https://remote.example/bob')).resolves.toBeNull();
  });
});

describe('getUserRemoteInfo', () => {
  function serveFullSite() {
    serve('https://remote.example/.well-known/host-meta', HOST_META_JSON, 'application/xrd+xml');
    serve(
      'https://remote.example/.well-known/webfinger?resource=https%3A%2F%2Fremote.example%2Fbob',
      WEBFINGER_JSON,
      'application/jrd+json'
    );
    serve('https://remote.example/bob/feed', ATOM_FEED, 'application/atom+xml');
    serve('https://remote.example/bob', HTML_PAGE, 'text/html');
  }

  it('assembles a complete remote user from webfinger plus the feed', async () => {
    serveFullSite();

    const info = await getUserRemoteInfo('https://remote.example/bob', 'alice');

    expect(info).toMatchObject({
      localUsername: 'alice',
      profileUrl: 'https://remote.example/bob',
      feedUrl: 'https://remote.example/bob/feed',
      salmonUrl: 'https://remote.example/salmon',
      webmentionUrl: 'https://remote.example/webmention',
      activityPubActorUrl: 'https://remote.example/users/bob',
      hubUrl: 'https://hub.example/',
      username: 'bobby',
      name: 'Bob B',
    });
  });

  it('sorts a newly discovered user last', async () => {
    serveFullSite();

    const info = await getUserRemoteInfo('https://remote.example/bob', 'alice');

    expect(info.order).toBe(Math.pow(2, 31) - 1);
  });

  it('discovers the feed from the html when there is no webfinger at all', async () => {
    serve('https://remote.example/bob', HTML_PAGE, 'text/html');
    serve('https://remote.example/bob/feed', ATOM_FEED, 'application/atom+xml');

    const info = await getUserRemoteInfo('https://remote.example/bob', 'alice');

    expect(info.feedUrl).toBe('https://remote.example/bob/feed');
    expect(info.profileUrl).toBe('https://remote.example/bob');
    expect(info.webmentionUrl).toBe('https://remote.example/wm');
  });

  it('falls back to the feed author uri, then the site url, for the profile', async () => {
    serve('https://remote.example/bob', ATOM_FEED, 'application/atom+xml');

    const info = await getUserRemoteInfo('https://remote.example/bob', 'alice');

    expect(info.profileUrl).toBe('https://remote.example/bob');
  });

  it('falls back to the feed title for the username when poco is absent', async () => {
    serve(
      'https://remote.example/bob',
      `<?xml version="1.0"?><rss version="2.0"><channel><title>Bob RSS</title><link>https://remote.example/bob</link>
       <item><title>x</title><link>https://remote.example/bob/1</link><guid>1</guid></item></channel></rss>`,
      'application/rss+xml'
    );

    const info = await getUserRemoteInfo('https://remote.example/bob', 'alice');

    expect(info.username).toBe('Bob RSS');
  });

  it('defaults the favicon to /favicon.jpg on the remote origin', async () => {
    serve('https://remote.example/bob', ATOM_FEED, 'application/atom+xml');

    const info = await getUserRemoteInfo('https://remote.example/bob', 'alice');

    expect(info.favicon).toBe('https://remote.example/favicon.jpg');
    expect(info.avatar).toBe('https://remote.example/favicon.jpg');
  });

  it('makes every discovered url absolute against the site being followed', async () => {
    serve(
      'https://remote.example/.well-known/host-meta',
      `<XRD><Link rel="lrdd" type="application/json" template="https://remote.example/.well-known/webfinger?resource={uri}"/></XRD>`,
      'application/xrd+xml'
    );
    serve(
      'https://remote.example/.well-known/webfinger?resource=https%3A%2F%2Fremote.example%2Fbob',
      JSON.stringify({
        aliases: ['https://remote.example/bob'],
        links: [
          { rel: 'http://schemas.google.com/g/2010#updates-from', href: '/bob/feed' },
          { rel: 'salmon', href: '/salmon' },
          { rel: 'webmention', href: '/webmention' },
          { rel: 'self', type: 'application/activity+json', href: '/users/bob' },
        ],
      }),
      'application/jrd+json'
    );
    serve('https://remote.example/bob/feed', ATOM_FEED, 'application/atom+xml');

    const info = await getUserRemoteInfo('https://remote.example/bob', 'alice');

    expect(info.feedUrl).toBe('https://remote.example/bob/feed');
    expect(info.salmonUrl).toBe('https://remote.example/salmon');
    expect(info.webmentionUrl).toBe('https://remote.example/webmention');
    expect(info.activityPubActorUrl).toBe('https://remote.example/users/bob');
  });

  it('falls back to the profile url as the actor url for OStatus-only peers', async () => {
    serve('https://remote.example/bob', ATOM_FEED, 'application/atom+xml');

    const info = await getUserRemoteInfo('https://remote.example/bob', 'alice');

    expect(info.activityPubActorUrl).toBe('https://remote.example/bob');
  });

  it('rejects when the site serves neither a feed nor a feed link', async () => {
    serve('https://remote.example/bob', '<html><head><title>nope</title></head><body></body></html>', 'text/html');

    await expect(getUserRemoteInfo('https://remote.example/bob', 'alice')).rejects.toThrow(/no feed url/);
  });
});

describe('discoverUserRemoteInfoSaveAndSubscribe', () => {
  beforeEach(() => {
    serve('https://remote.example/bob', ATOM_FEED, 'application/atom+xml');
  });

  it('saves the discovered user as followed and returns the persisted row', async () => {
    const saved = userRemote({ id: 42 });
    db.getRemoteUser.mockResolvedValueOnce(null).mockResolvedValueOnce(saved);

    await expect(discoverUserRemoteInfoSaveAndSubscribe('https://remote.example/bob', 'alice')).resolves.toBe(saved);

    expect(db.saveRemoteUser).toHaveBeenCalledWith(
      expect.objectContaining({ localUsername: 'alice', following: true, id: -1 })
    );
  });

  it('reuses the existing row id when re-following someone', async () => {
    db.getRemoteUser.mockResolvedValue(userRemote({ id: 42 }));

    await discoverUserRemoteInfoSaveAndSubscribe('https://remote.example/bob', 'alice');

    expect(db.saveRemoteUser).toHaveBeenCalledWith(expect.objectContaining({ id: 42, following: true }));
  });
});
