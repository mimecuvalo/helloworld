import { beforeEach, describe, expect, it, vi } from 'vitest';

// Record the options parseFeed hands feedparser, while still parsing for real.
const constructorOptions: (Record<string, unknown> | undefined)[] = [];
vi.mock('feedparser', async (importOriginal) => {
  const mod = await importOriginal<{ default: new (options?: Record<string, unknown>) => object }>();
  return {
    ...mod,
    default: class extends mod.default {
      constructor(options?: Record<string, unknown>) {
        super(options);
        constructorOptions.push(options);
      }
    },
  };
});

import { parseFeed } from 'server/social/feeds';

// Shaped like kottke.org's feed: xml:base on the root, plus an absolute rel="self" link.
const ATOM_FEED = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:base="https://kottke.org/">
  <title>kottke.org</title>
  <link rel="self" href="https://feeds.kottke.org/main" />
  <link rel="alternate" type="text/html" href="https://kottke.org/" />
  <updated>2026-07-20T00:00:00Z</updated>
  <entry>
    <title>Now they're ramming fish</title>
    <link href="https://kottke.org/26/07/now-theyre-ramming-fish" />
    <id>tag:kottke.org,2026:1</id>
    <updated>2026-07-20T00:00:00Z</updated>
    <content type="html">&lt;p&gt;hello&lt;/p&gt;</content>
  </entry>
</feed>`;

const RSS_FEED = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel>
  <title>xkcd</title>
  <link>https://xkcd.com/</link>
  <item>
    <title>A comic</title>
    <link>https://xkcd.com/3276/</link>
    <guid>https://xkcd.com/3276/</guid>
  </item>
</channel></rss>`;

describe('parseFeed', () => {
  beforeEach(() => {
    constructorOptions.length = 0;
  });

  it('parses an Atom feed with an absolute self link', async () => {
    const { feedEntries, feedMeta } = await parseFeed(ATOM_FEED, 'https://feeds.kottke.org/main');

    expect(feedMeta.title).toBe('kottke.org');
    expect(feedEntries).toHaveLength(1);
    expect(feedEntries[0]?.link).toBe('https://kottke.org/26/07/now-theyre-ramming-fish');
  });

  // Without feedurl, closing </feed> pops the xml:base and feedparser writes `false` into its own
  // parse stack, then assigns a property to it. Sloppy-mode CJS swallows that; the ESM server
  // bundle throws `Cannot create property 'feed' on boolean 'false'` and the whole feed is lost.
  // Node loads feedparser as CJS here, so assert on the option rather than on a crash we can't
  // reproduce under vitest.
  it('gives feedparser the feed url so it always has an xml:base', async () => {
    await parseFeed(ATOM_FEED, 'https://feeds.kottke.org/main');

    expect(constructorOptions[0]).toEqual({ feedurl: 'https://feeds.kottke.org/main' });
  });

  it('parses an RSS feed', async () => {
    const { feedEntries, feedMeta } = await parseFeed(RSS_FEED, 'https://xkcd.com/rss.xml');

    expect(feedMeta.title).toBe('xkcd');
    expect(feedEntries).toHaveLength(1);
  });

  it('rejects when the url does not serve a feed', async () => {
    await expect(parseFeed('<html><body>nope</body></html>', 'https://example.com')).rejects.toContain('Not a feed');
  });
});
