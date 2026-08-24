import { describe, expect, it } from 'vitest';
import {
  atUriFor,
  bskyPermalink,
  buildPostRecord,
  cidForRecord,
  postTextFor,
  recordFor,
  renderPostText,
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
  it('derives a stable at:// uri from the content name', () => {
    expect(atUriFor(DID, content())).toBe(`at://${DID}/app.bsky.feed.post/hello`);
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

    expect(record.uri).toBe(`at://${DID}/app.bsky.feed.post/hello`);
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
