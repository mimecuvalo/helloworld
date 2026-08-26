import { describe, expect, it } from 'vitest';
import { renderOpml } from 'server/social/opml-xml';
import { HOST, user, userRemote } from './fixtures';

function parse(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  return doc;
}

const groups = (doc: Document) => [...doc.querySelectorAll('body > outline')];
const feedsIn = (group: Element) => [...group.querySelectorAll('outline')];

describe('renderOpml', () => {
  const alice = user();
  const bob = userRemote();
  const carol = userRemote({
    id: 6,
    username: 'carol',
    name: 'Carol C',
    profileUrl: 'https://elsewhere.example/carol',
    feedUrl: 'https://elsewhere.example/carol.atom',
  });
  // A peer followed over AT Protocol: discovery leaves feedUrl empty.
  const dave = userRemote({
    id: 7,
    username: 'dave.bsky.social',
    name: 'Dave D',
    feedUrl: '',
    atprotoDid: 'did:plc:d',
  });

  it('is a well-formed OPML 2.0 document', () => {
    const xml = renderOpml(HOST, alice, [bob]);
    const root = parse(xml).documentElement;

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><opml')).toBe(true);
    expect(root.tagName).toBe('opml');
    expect(root.getAttribute('version')).toBe('2.0');
  });

  it('names the owner in the head', () => {
    const head = parse(renderOpml(HOST, alice, [])).querySelector('head')!;

    expect(head.querySelector('title')?.textContent).toBe("Feeds for Alice A's blogroll");
    expect(head.querySelector('ownerName')?.textContent).toBe('Alice A');
    expect(head.querySelector('ownerId')?.textContent).toBe(`https://${HOST}/alice`);
  });

  it('dates the document in RFC-822, as OPML requires', () => {
    const now = new Date('2026-08-26T10:00:00.000Z');
    const doc = parse(renderOpml(HOST, alice, [], now));

    expect(doc.querySelector('dateCreated')?.textContent).toBe(now.toUTCString());
  });

  it('lists each followed feed as an rss outline pointing at feed and site', () => {
    const doc = parse(renderOpml(HOST, alice, [bob, carol]));
    const [blogs] = groups(doc);

    expect(blogs.getAttribute('text')).toBe('Blogs');
    expect(
      feedsIn(blogs).map((o) => [o.getAttribute('text'), o.getAttribute('xmlUrl'), o.getAttribute('htmlUrl')])
    ).toEqual([
      ['Bob B', bob.feedUrl, bob.profileUrl],
      ['Carol C', carol.feedUrl, carol.profileUrl],
    ]);
    expect(feedsIn(blogs).every((o) => o.getAttribute('type') === 'rss')).toBe(true);
    // text and title carry the same label; readers differ on which they show.
    expect(feedsIn(blogs).map((o) => o.getAttribute('title'))).toEqual(['Bob B', 'Carol C']);
  });

  it('falls back to the handle when a peer has no display name', () => {
    const doc = parse(renderOpml(HOST, alice, [userRemote({ name: '' })]));

    expect(doc.querySelector('body outline outline')?.getAttribute('text')).toBe('bob');
  });

  it('keeps feedless bluesky follows out of the rss group so readers do not fetch them', () => {
    const doc = parse(renderOpml(HOST, alice, [bob, dave]));
    const [blogs, bluesky] = groups(doc);

    expect(feedsIn(blogs).map((o) => o.getAttribute('xmlUrl'))).toEqual([bob.feedUrl]);
    expect(bluesky.getAttribute('text')).toBe('Bluesky');
    const [outline] = feedsIn(bluesky);
    expect(outline.getAttribute('type')).toBe('link');
    expect(outline.getAttribute('url')).toBe(dave.profileUrl);
    expect(outline.getAttribute('xmlUrl')).toBeNull();
  });

  it('omits a group entirely when nothing falls into it', () => {
    expect(groups(parse(renderOpml(HOST, alice, [bob])))).toHaveLength(1);
    expect(groups(parse(renderOpml(HOST, alice, [dave])))).toHaveLength(1);
    expect(groups(parse(renderOpml(HOST, alice, [])))).toHaveLength(0);
  });

  it('escapes peer-controlled names and urls so a follow cannot inject markup', () => {
    const hostile = userRemote({
      name: 'ev<il> & "co"',
      feedUrl: 'https://remote.example/feed?a=1&b="2"',
    });
    const doc = parse(renderOpml(HOST, alice, [hostile]));
    const outline = doc.querySelector('body outline outline')!;

    expect(outline.getAttribute('text')).toBe('ev<il> & "co"');
    expect(outline.getAttribute('xmlUrl')).toBe('https://remote.example/feed?a=1&b="2"');
  });

  it('renders a valid empty blogroll for a user who follows nobody', () => {
    const doc = parse(renderOpml(HOST, alice, []));

    expect(doc.querySelector('body')?.children).toHaveLength(0);
  });
});
