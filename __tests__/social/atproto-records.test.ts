import { describe, expect, it } from 'vitest';
import {
  atUriFor,
  atUriFromBskyUrl,
  imageUrlsIn,
  renderEmbed,
  bskyPermalink,
  buildPostRecord,
  cidForRecord,
  postTextFor,
  recordFor,
  renderPostText,
  rkeyFor,
  rkeyOfUri,
  truncateToGraphemes,
} from 'server/social/atproto-records';
import { HOST, content, user } from './fixtures';

const DID = `did:web:${HOST}:alice`;

describe('postTextFor', () => {
  it('leads with the title, then the body as plain text', () => {
    expect(postTextFor(content({ title: 'Hello', view: '<p>a <em>post</em></p>' }))).toBe('Hello\n\na post');
  });

  it('omits the title on a comment, which has none of its own', () => {
    expect(postTextFor(content({ section: 'comments', title: '', view: '<p>nice</p>' }))).toBe('nice');
  });
});

describe('truncateToGraphemes', () => {
  it('leaves short text alone', () => {
    expect(truncateToGraphemes('short', 300)).toBe('short');
  });

  it('cuts to the lexicon limit with an ellipsis', () => {
    const truncated = truncateToGraphemes('a'.repeat(400));

    expect([...new Intl.Segmenter().segment(truncated)]).toHaveLength(300);
    expect(truncated.endsWith('…')).toBe(true);
  });

  it('counts graphemes, not code units, so emoji are not split', () => {
    // Each of these is one grapheme but several UTF-16 code units.
    const flags = '🇺🇸'.repeat(10);

    expect(truncateToGraphemes(flags, 5)).toBe('🇺🇸🇺🇸🇺🇸🇺🇸…');
  });
});

describe('buildPostRecord', () => {
  const record = () => buildPostRecord(HOST, content(), user());

  it('is an app.bsky.feed.post carrying the permalink as an external embed', () => {
    expect(record()).toMatchObject({
      $type: 'app.bsky.feed.post',
      createdAt: '2026-02-01T00:00:00.000Z',
      langs: ['en'],
      embed: {
        $type: 'app.bsky.embed.external',
        external: { uri: `https://${HOST}/alice/blog/hello`, title: 'Hello' },
      },
    });
  });

  it('never exceeds the 300-grapheme text limit', () => {
    const long = buildPostRecord(HOST, content({ view: `<p>${'word '.repeat(400)}</p>` }), user());

    expect([...new Intl.Segmenter().segment(long.text as string)].length).toBeLessThanOrEqual(300);
  });
});

describe('record identity', () => {
  it('derives a stable at:// uri keyed by the post TID', () => {
    expect(atUriFor(DID, content())).toBe(`at://${DID}/app.bsky.feed.post/${rkeyFor(content())}`);
  });

  it('computes a real dag-cbor CIDv1, not a placeholder', async () => {
    const cid = await cidForRecord({ $type: 'app.bsky.feed.post', text: 'hi' });

    // v1 + dag-cbor + sha-256 encodes to a bafyrei… base32 string.
    expect(cid.startsWith('bafyrei')).toBe(true);
  });

  it('gives the same record the same CID every time', async () => {
    const record = { $type: 'app.bsky.feed.post', text: 'hi' };

    expect(await cidForRecord(record)).toBe(await cidForRecord(record));
  });

  it('gives different records different CIDs', async () => {
    expect(await cidForRecord({ text: 'a' })).not.toBe(await cidForRecord({ text: 'b' }));
  });

  it('bundles uri, cid and value together', async () => {
    const record = await recordFor(HOST, DID, content(), user());

    expect(record.uri).toBe(`at://${DID}/app.bsky.feed.post/${rkeyFor(content())}`);
    expect(record.cid).toBe(await cidForRecord(record.value));
  });

  it('reads the rkey back out of a uri and builds the bsky permalink', () => {
    const uri = `at://${DID}/app.bsky.feed.post/hello`;

    expect(rkeyOfUri(uri)).toBe('hello');
    expect(bskyPermalink('alice.bsky.social', uri)).toBe('https://bsky.app/profile/alice.bsky.social/post/hello');
  });
});

describe('renderPostText', () => {
  const link = (byteStart: number, byteEnd: number, uri: string) => ({
    index: { byteStart, byteEnd },
    features: [{ $type: 'app.bsky.richtext.facet#link', uri }],
  });

  it('renders plain text as a paragraph', () => {
    expect(renderPostText('hello')).toBe('<p>hello</p>');
  });

  it('escapes markup in the text', () => {
    expect(renderPostText('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('turns newlines into breaks', () => {
    expect(renderPostText('a\nb')).toBe('<p>a<br />b</p>');
  });

  it('links a link facet', () => {
    expect(renderPostText('see example.com now', [link(4, 15, 'https://example.com')])).toBe(
      '<p>see <a href="https://example.com" rel="noopener noreferrer">example.com</a> now</p>'
    );
  });

  it('resolves facet offsets as utf-8 bytes, not string indices', () => {
    // 'é' is two bytes; a naive string slice would cut in the wrong place.
    const text = 'é example.com';
    const bytes = Buffer.from(text, 'utf8');
    const start = bytes.indexOf(Buffer.from('example.com'));

    expect(renderPostText(text, [link(start, start + 11, 'https://example.com')])).toBe(
      '<p>é <a href="https://example.com" rel="noopener noreferrer">example.com</a></p>'
    );
  });

  it('renders mention and tag facets', () => {
    const mention = {
      index: { byteStart: 0, byteEnd: 4 },
      features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:abc' }],
    };
    expect(renderPostText('@bob hi', [mention])).toBe(
      '<p><a href="https://bsky.app/profile/did:plc:abc">@bob</a> hi</p>'
    );

    const tag = {
      index: { byteStart: 0, byteEnd: 5 },
      features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'cats' }],
    };
    expect(renderPostText('#cats rule', [tag])).toBe('<p><a href="https://bsky.app/hashtag/cats">#cats</a> rule</p>');
  });

  it('ignores facets that overlap or run past the end of the text', () => {
    expect(renderPostText('hi', [link(0, 99, 'https://example.com')])).toBe('<p>hi</p>');
  });

  it('handles a post with no facets at all', () => {
    expect(renderPostText('plain', [])).toBe('<p>plain</p>');
  });
});

describe('renderEmbed', () => {
  it('renders images, linking the thumb to the full size', () => {
    const html = renderEmbed({
      $type: 'app.bsky.embed.images#view',
      images: [{ thumb: 'https://cdn/t.jpg', fullsize: 'https://cdn/f.jpg', alt: 'a cat' }],
    });

    expect(html).toContain('<img src="https://cdn/t.jpg" alt="a cat" />');
    expect(html).toContain('href="https://cdn/f.jpg"');
  });

  it('renders a link card with its thumbnail', () => {
    const html = renderEmbed({
      $type: 'app.bsky.embed.external#view',
      external: {
        uri: 'https://example.com',
        title: 'A post',
        description: 'about things',
        thumb: 'https://cdn/c.jpg',
      },
    });

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('<strong>A post</strong>');
    expect(html).toContain('src="https://cdn/c.jpg"');
    expect(html).toContain('about things');
  });

  it('renders a quote post as a blockquote attributed to its author', () => {
    const html = renderEmbed({
      $type: 'app.bsky.embed.record#view',
      record: {
        uri: 'at://did:plc:bob/app.bsky.feed.post/xyz',
        value: { text: 'the original' },
        author: { handle: 'bob.bsky.social', displayName: 'Bob' },
      },
    });

    expect(html).toContain('<blockquote>');
    expect(html).toContain('the original');
    expect(html).toContain('bsky.app/profile/bob.bsky.social/post/xyz');
  });

  it('renders video with its poster', () => {
    const html = renderEmbed({
      $type: 'app.bsky.embed.video#view',
      playlist: 'https://cdn/v.m3u8',
      thumbnail: 'https://cdn/p.jpg',
    });

    expect(html).toContain('<video controls poster="https://cdn/p.jpg"');
  });

  it('escapes attacker-controlled text', () => {
    const html = renderEmbed({
      $type: 'app.bsky.embed.external#view',
      external: { uri: 'https://x.example', title: '<script>alert(1)</script>' },
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('returns nothing for an absent or unrecognized embed', () => {
    expect(renderEmbed(null)).toBe('');
    expect(renderEmbed(undefined)).toBe('');
    expect(renderEmbed({ $type: 'app.bsky.embed.somethingNew' })).toBe('');
  });
});

describe('imageUrlsIn', () => {
  it('finds absolute image urls in the post body', () => {
    const urls = imageUrlsIn(
      HOST,
      content({ view: '<p><img src="https://cdn/a.jpg" /><img src="https://cdn/b.jpg" /></p>' })
    );

    expect(urls).toEqual(['https://cdn/a.jpg', 'https://cdn/b.jpg']);
  });

  it('skips the analytics pixel that rides along with every post', () => {
    expect(imageUrlsIn(HOST, content({ view: '<p>hi</p>' }))).toEqual([]);
  });

  it('deduplicates a repeated image', () => {
    const urls = imageUrlsIn(HOST, content({ view: '<img src="https://cdn/a.jpg" /><img src="https://cdn/a.jpg" />' }));

    expect(urls).toEqual(['https://cdn/a.jpg']);
  });
});

describe('atUriFromBskyUrl', () => {
  const resolve = async (handle: string) => (handle === 'bob.bsky.social' ? 'did:plc:bob' : null);

  it('converts a bsky.app permalink back to an at:// uri', async () => {
    await expect(atUriFromBskyUrl('https://bsky.app/profile/bob.bsky.social/post/abc', resolve)).resolves.toBe(
      'at://did:plc:bob/app.bsky.feed.post/abc'
    );
  });

  it('passes an at:// uri straight through without resolving', async () => {
    await expect(atUriFromBskyUrl('at://did:plc:bob/app.bsky.feed.post/abc', resolve)).resolves.toBe(
      'at://did:plc:bob/app.bsky.feed.post/abc'
    );
  });

  it('handles a permalink that already carries a did', async () => {
    await expect(atUriFromBskyUrl('https://bsky.app/profile/did:plc:carol/post/xyz', resolve)).resolves.toBe(
      'at://did:plc:carol/app.bsky.feed.post/xyz'
    );
  });

  it('returns null for a url that is not a bluesky post', async () => {
    await expect(atUriFromBskyUrl('https://mastodon.social/@bob/1', resolve)).resolves.toBeNull();
  });

  it('returns null when the handle cannot be resolved', async () => {
    await expect(atUriFromBskyUrl('https://bsky.app/profile/ghost.example/post/abc', resolve)).resolves.toBeNull();
  });
});

describe('record keys are TIDs', () => {
  // The PDS rejects anything that is not a TID with "Invalid TID string", so
  // this is not cosmetic — a non-TID rkey fails every publish.
  const TID = /^[234567abcdefghijklmnopqrstuvwxyz]{13}$/;

  it('produces a 13-character base32-sortable key', () => {
    expect(rkeyFor(content())).toMatch(TID);
  });

  it('never leaks the post slug into the key', () => {
    expect(rkeyFor(content({ name: 'bridge-test-cdp6S999im' }))).not.toContain('bridge');
  });

  it('is stable for the same post, so an edit replaces rather than duplicates', () => {
    expect(rkeyFor(content())).toBe(rkeyFor(content()));
  });

  it('differs for posts created at different times', () => {
    const a = rkeyFor(content({ id: 1, createdAt: new Date('2026-02-01T00:00:00Z') }));
    const b = rkeyFor(content({ id: 1, createdAt: new Date('2026-02-02T00:00:00Z') }));

    expect(a).not.toBe(b);
  });

  it('differs for distinct posts created in the same millisecond', () => {
    const at = new Date('2026-02-01T00:00:00Z');

    expect(rkeyFor(content({ id: 1, createdAt: at }))).not.toBe(rkeyFor(content({ id: 2, createdAt: at })));
  });

  it('sorts lexicographically in timestamp order, which is the point of a TID', () => {
    const older = rkeyFor(content({ id: 1, createdAt: new Date('2026-01-01T00:00:00Z') }));
    const newer = rkeyFor(content({ id: 1, createdAt: new Date('2026-06-01T00:00:00Z') }));

    expect(older < newer).toBe(true);
  });
});
