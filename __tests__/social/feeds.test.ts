import type FeedParser from 'feedparser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ getRemoteContent: vi.fn(), saveRemoteContent: vi.fn() }));
vi.mock('server/social/db', () => db);

import {
  discoverAndParseFeedFromUrl,
  mapFeedAndInsertIntoDb,
  parseFeed,
  parseFeedAndInsertIntoDb,
  retrieveFeed,
} from 'server/social/feeds';
import { contentRemote, userRemote } from './fixtures';

const NOW = new Date('2026-06-15T12:00:00.000Z');

function atomFeed(entry: string, meta = '') {
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:thr="http://purl.org/syndication/thread/1.0"
      xmlns:poco="http://portablecontacts.net/spec/1.0" xmlns:media="http://search.yahoo.com/mrss/">
  <title>Bob's blog</title>${meta}
  ${entry}
</feed>`;
}

const ENTRY = `<entry>
  <title>A post</title>
  <link href="https://remote.example/bob/1"/>
  <id>tag:remote.example,2026:1</id>
  <updated>2026-06-14T00:00:00.000Z</updated>
  <published>2026-06-13T00:00:00.000Z</published>
  <content type="html">&lt;p&gt;hello &lt;script&gt;alert(1)&lt;/script&gt;&lt;/p&gt;</content>
</entry>`;

let routes: Record<string, () => Response>;
let fetchMock: ReturnType<typeof vi.fn>;

function serve(url: string, body: string, contentType: string) {
  routes[url] = () => new Response(body, { status: 200, headers: { 'content-type': contentType } });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  routes = {};
  fetchMock = vi.fn(async (url: string) => routes[String(url)]?.() ?? new Response('nope', { status: 404 }));
  vi.stubGlobal('fetch', fetchMock);
  db.getRemoteContent.mockResolvedValue(null);
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// The single saved entry from the last mapFeedAndInsertIntoDb call.
async function ingest(feedXml: string, remote = userRemote()) {
  const { feedEntries } = await parseFeed(feedXml, remote.feedUrl);
  return await ingestItems(feedEntries, remote);
}

async function ingestItems(feedEntries: FeedParser.Item[], remote = userRemote()) {
  await mapFeedAndInsertIntoDb(remote, feedEntries);
  return db.saveRemoteContent.mock.calls[0]?.[0]?.[0];
}

// A feedparser item as handed to mapFeedAndInsertIntoDb, for the cases a real
// feed cannot express (feedparser normalizes too much of the document away).
function item(overrides: Partial<FeedParser.Item> = {}) {
  return {
    guid: 'tag:remote.example,2026:1',
    link: 'https://remote.example/bob/1',
    permalink: 'https://remote.example/bob/1',
    title: 'A post',
    description: '<p>hello</p>',
    date: new Date('2026-06-14T00:00:00.000Z'),
    pubdate: new Date('2026-06-13T00:00:00.000Z'),
    ...overrides,
  } as FeedParser.Item;
}

describe('retrieveFeed', () => {
  it('returns the raw feed body', async () => {
    serve('https://remote.example/bob/feed', atomFeed(ENTRY), 'application/atom+xml');

    await expect(retrieveFeed('https://remote.example/bob/feed')).resolves.toContain("<title>Bob's blog</title>");
  });

  it('throws on an http error so the caller can skip the feed', async () => {
    await expect(retrieveFeed('https://remote.example/gone')).rejects.toThrow();
  });
});

describe('discoverAndParseFeedFromUrl', () => {
  it('parses a url that already serves a feed', async () => {
    serve('https://remote.example/bob/feed', atomFeed(ENTRY), 'application/atom+xml');

    const { feedEntries, feedMeta, feedUrl } = await discoverAndParseFeedFromUrl('https://remote.example/bob/feed');

    expect(feedUrl).toBe('https://remote.example/bob/feed');
    expect(feedMeta.title).toBe("Bob's blog");
    expect(feedEntries).toHaveLength(1);
  });

  it('follows the rss/atom alternate link on an html page', async () => {
    serve(
      'https://remote.example/bob',
      `<html><head><link rel="alternate" type="text/html" href="/other"/>
       <link rel="alternate" type="application/atom+xml" href="/bob/feed"/></head></html>`,
      'text/html'
    );
    serve('https://remote.example/bob/feed', atomFeed(ENTRY), 'application/atom+xml');

    const { feedUrl, feedEntries } = await discoverAndParseFeedFromUrl('https://remote.example/bob');

    expect(feedUrl).toBe('https://remote.example/bob/feed');
    expect(feedEntries).toHaveLength(1);
  });

  it('throws a 404 when an html page advertises no feed', async () => {
    serve('https://remote.example/bob', '<html><head></head><body>hi</body></html>', 'text/html');

    await expect(discoverAndParseFeedFromUrl('https://remote.example/bob')).rejects.toMatchObject({
      status: 404,
      message: expect.stringContaining('no feed url'),
    });
  });
});

describe('mapFeedAndInsertIntoDb', () => {
  it('maps an entry onto the remote content shape', async () => {
    const entry = await ingest(atomFeed(ENTRY));

    expect(entry).toMatchObject({
      toUsername: 'alice',
      fromUsername: 'https://remote.example/bob',
      fromUserRemoteId: '5',
      username: 'bob',
      type: 'post',
      title: 'A post',
      postId: 'tag:remote.example,2026:1',
      link: 'https://remote.example/bob/1',
      commentsCount: 0,
    });
    expect(entry.updatedAt).toEqual(new Date('2026-06-14T00:00:00.000Z'));
  });

  it('sanitizes feed html before storing it', async () => {
    const entry = await ingest(atomFeed(ENTRY));

    expect(entry.view).toBe('<p>hello </p>');
  });

  it('inserts every mapped entry in one bulk write', async () => {
    const feed = atomFeed(
      `${ENTRY}<entry><title>Two</title><link href="https://remote.example/bob/2"/><id>id2</id>
       <updated>2026-06-14T00:00:00.000Z</updated></entry>`
    );
    const { feedEntries } = await parseFeed(feed, 'https://remote.example/bob/feed');

    await mapFeedAndInsertIntoDb(userRemote(), feedEntries);

    expect(db.saveRemoteContent).toHaveBeenCalledTimes(1);
    expect(db.saveRemoteContent.mock.calls[0][0]).toHaveLength(2);
  });

  it('writes nothing when every entry is skipped', async () => {
    db.getRemoteContent.mockResolvedValue(contentRemote({ type: 'comment' }));

    await ingest(atomFeed(ENTRY));

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });

  it('never overwrites a comment we already stored for that id', async () => {
    db.getRemoteContent.mockResolvedValue(contentRemote({ id: 3, type: 'comment' }));

    await ingest(atomFeed(ENTRY));

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });

  it('skips an entry whose stored copy is already at the same updated stamp', async () => {
    db.getRemoteContent.mockResolvedValue(
      contentRemote({ id: 3, type: 'post', updatedAt: new Date('2026-06-14T00:00:00.000Z') })
    );

    await ingest(atomFeed(ENTRY));

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });

  it('re-saves an edited entry under its existing row id', async () => {
    db.getRemoteContent.mockResolvedValue(
      contentRemote({ id: 3, type: 'post', updatedAt: new Date('2026-06-01T00:00:00.000Z') })
    );

    const entry = await ingest(atomFeed(ENTRY));

    expect(entry.id).toBe(3);
    expect(db.getRemoteContent).toHaveBeenCalledWith('alice', 'tag:remote.example,2026:1');
  });

  it('drops entries older than 30 days so a backfilled feed cannot flood the reader', async () => {
    const old = ENTRY.replace('2026-06-14T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

    await ingest(atomFeed(old));

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });

  it('keeps an entry right inside the 30-day window', async () => {
    const recent = ENTRY.replace('2026-06-14T00:00:00.000Z', '2026-05-20T00:00:00.000Z');

    expect(await ingest(atomFeed(recent))).toMatchObject({ title: 'A post' });
  });

  it('titles an untitled entry rather than storing an empty string', async () => {
    const entry = await ingest(atomFeed(ENTRY.replace('<title>A post</title>', '')));

    expect(entry.title).toBe('untitled');
  });

  it('decodes the numeric entities WordPress feeds emit in titles', async () => {
    const entry = await ingest(
      atomFeed(ENTRY.replace('A post', 'a &amp;#8220;quote&amp;#8221; &amp;#8212; and&amp;#8230;'))
    );

    expect(entry.title).toBe('a “quote” — and…');
  });

  // feedparser resolves links inside the entry body against the feed's xml:base,
  // so the prefixing below only has to catch what it leaves behind.
  it('lets feedparser resolve body links against the feed url', async () => {
    const relative = ENTRY.replace(
      '&lt;p&gt;hello &lt;script&gt;alert(1)&lt;/script&gt;&lt;/p&gt;',
      '&lt;a href="/post/1"&gt;x&lt;/a&gt;'
    );

    const entry = await ingest(atomFeed(relative));

    expect(entry.view).toContain('href="https://remote.example/post/1"');
  });

  it('prefixes any root-relative link feedparser left alone with the remote profile', async () => {
    const entry = await ingestItems([item({ description: `<a href="/post/1">x</a><img src="/img/a.png" />` })]);

    expect(entry.view).toContain('href="https://remote.example/bob/post/1"');
    expect(entry.view).toContain('src="https://remote.example/bob/img/a.png"');
  });

  it('leaves absolute links in the entry body alone', async () => {
    const entry = await ingestItems([item({ description: '<a href="https://elsewhere.example/x">x</a>' })]);

    expect(entry.view).toContain('href="https://elsewhere.example/x"');
  });

  it('builds a thumbnail link when a media entry has no description', async () => {
    const media = `<entry xmlns:media="http://search.yahoo.com/mrss/">
      <title>A video</title><link href="https://remote.example/v/1"/><id>v1</id>
      <updated>2026-06-14T00:00:00.000Z</updated>
      <media:group><media:thumbnail url="https://remote.example/thumb.jpg"/></media:group>
    </entry>`;

    const entry = await ingest(atomFeed(media));

    expect(entry.view).toContain('<img src="https://remote.example/thumb.jpg"');
    expect(entry.view).toContain('href="https://remote.example/v/1"');
  });

  it('records the replies count and thread reference from an OStatus entry', async () => {
    const threaded = `<entry xmlns:atom="http://www.w3.org/2005/Atom">
      <title>A reply</title><link href="https://remote.example/bob/2"/><id>id2</id>
      <updated>2026-06-14T00:00:00.000Z</updated>
      <atom:link rel="replies" href="https://remote.example/replies" count="7" updated="2026-06-14T01:00:00.000Z"/>
      <thr:in-reply-to ref="https://example.com/alice/blog/hello"/>
    </entry>`;

    const entry = await ingest(atomFeed(threaded));

    expect(entry.commentsCount).toBe(7);
    expect(entry.commentsUpdated).toEqual(new Date('2026-06-14T01:00:00.000Z'));
    expect(entry.thread).toBe('https://example.com/alice/blog/hello');
  });

  it('picks up the poco avatar when the feed author has one', async () => {
    const withAvatar = `<entry xmlns:atom="http://www.w3.org/2005/Atom">
      <title>A post</title><link href="https://remote.example/bob/3"/><id>id3</id>
      <updated>2026-06-14T00:00:00.000Z</updated>
      <atom:author><poco:photos><poco:value>https://remote.example/av.png</poco:value></poco:photos></atom:author>
    </entry>`;

    expect((await ingest(atomFeed(withAvatar))).avatar).toBe('https://remote.example/av.png');
  });

  it('falls back to the entry link when the feed has no guid', async () => {
    const noGuid = `<item><title>x</title><link>https://remote.example/bob/9</link>
      <pubDate>Sun, 14 Jun 2026 00:00:00 GMT</pubDate></item>`;
    const rss = `<?xml version="1.0"?><rss version="2.0"><channel><title>Bob</title>
      <link>https://remote.example/bob</link>${noGuid}</channel></rss>`;

    const entry = await ingest(rss);

    expect(entry.postId).toBe('https://remote.example/bob/9');
    expect(entry.link).toBe('https://remote.example/bob/9');
  });

  it('survives a mapping failure without throwing at the caller', async () => {
    db.getRemoteContent.mockRejectedValue(new Error('db down'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(ingest(atomFeed(ENTRY))).resolves.toBeUndefined();

    expect(db.saveRemoteContent).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('mapFeed FAILED'));
  });

  it('survives an insert failure without throwing at the caller', async () => {
    db.saveRemoteContent.mockRejectedValue(new Error('db down'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(mapFeedAndInsertIntoDb(userRemote(), [item()])).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('db insertion failed'));
  });
});

describe('parseFeedAndInsertIntoDb', () => {
  it('parses and stores in one step', async () => {
    await parseFeedAndInsertIntoDb(userRemote(), atomFeed(ENTRY));

    expect(db.saveRemoteContent.mock.calls[0][0][0]).toMatchObject({ title: 'A post' });
  });

  it('logs and swallows an unparseable feed so one bad peer cannot break the cron', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(parseFeedAndInsertIntoDb(userRemote(), '<html>not a feed</html>')).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('parseFeed FAILED'));
    expect(db.saveRemoteContent).not.toHaveBeenCalled();
  });
});
