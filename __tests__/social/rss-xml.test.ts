import { describe, expect, it } from 'vitest';
import { renderRssFeed } from 'server/social/rss-xml';
import { WEB_SUB_HUB } from 'util/constants';
import { HOST, content, user } from './fixtures';

const REQ = '/api/social/rss?resource=https%3A%2F%2Fexample.com%2Falice';

// Same approach as feed-xml.test.ts: the renderer emits XML by hand, so parse
// the result rather than matching substrings.
function parse(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  return doc;
}

describe('renderRssFeed', () => {
  const render = (feed = [content()], owner = user()) => renderRssFeed(HOST, REQ, feed, owner);

  it('is well-formed XML with the stylesheet declaration first', () => {
    const xml = render();

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet href="/rss.xsl"')).toBe(true);
    parse(xml);
  });

  it('is an rss 2.0 document declaring the atom, content and dc namespaces', () => {
    const rss = parse(render()).documentElement;

    expect(rss.tagName).toBe('rss');
    expect(rss.getAttribute('version')).toBe('2.0');
    expect(rss.getAttribute('xmlns:atom')).toBe('http://www.w3.org/2005/Atom');
    expect(rss.getAttribute('xmlns:content')).toBe('http://purl.org/rss/1.0/modules/content/');
    expect(rss.getAttribute('xmlns:dc')).toBe('http://purl.org/dc/elements/1.1/');
  });

  it('describes the channel from the owner', () => {
    const channel = parse(render()).querySelector('channel');

    expect(channel?.querySelector('title')?.textContent).toBe("Alice's site");
    expect(channel?.querySelector('link')?.textContent).toBe(`https://${HOST}/alice`);
    expect(channel?.querySelector('description')?.textContent).toBe('a site');
    expect(channel?.querySelector('generator')?.textContent).toBe('Hello, world.');
  });

  it('points self, hub and the atom alternate at absolute urls', () => {
    const doc = parse(render());
    const href = (rel: string) => doc.querySelector(`channel > link[rel="${rel}"]`)?.getAttribute('href');

    expect(href('self')).toBe(`https://${HOST}${REQ}`);
    expect(href('hub')).toBe(WEB_SUB_HUB);
    expect(href('alternate')).toBe(
      `https://${HOST}/api/social/feed?resource=${encodeURIComponent(`https://${HOST}/alice`)}`
    );
  });

  it('dates the channel and its items in rfc-822, not iso-8601', () => {
    const doc = parse(render());

    expect(doc.querySelector('channel > lastBuildDate')?.textContent).toBe('Mon, 02 Feb 2026 00:00:00 GMT');
    expect(doc.querySelector('item > pubDate')?.textContent).toBe('Sun, 01 Feb 2026 00:00:00 GMT');
  });

  it('gives each item a permalink guid matching its link', () => {
    const item = parse(render()).querySelector('item');
    const url = `https://${HOST}/alice/blog/hello`;

    expect(item?.querySelector('title')?.textContent).toBe('Hello');
    expect(item?.querySelector('link')?.textContent).toBe(url);
    expect(item?.querySelector('guid')?.textContent).toBe(url);
    expect(item?.querySelector('guid')?.getAttribute('isPermaLink')).toBe('true');
  });

  it('carries the full html body in content:encoded and a plain-text description', () => {
    const doc = parse(render([content({ view: '<p>hi <em>there</em></p>' })]));
    const encoded = doc.getElementsByTagName('content:encoded')[0];

    expect(encoded?.textContent).toContain('<p>hi <em>there</em></p>');
    // the stats tracking pixel rides along, exactly as it does in the atom feed
    expect(encoded?.textContent).toContain('/api/stats?resource=');
    expect(doc.querySelector('item > description')?.textContent).toBe('hi there');
  });

  it('rewrites relative /resource paths to absolute urls', () => {
    const doc = parse(render([content({ view: '<img src="/resource/pic.jpg" />' })]));

    expect(doc.getElementsByTagName('content:encoded')[0]?.textContent).toContain(
      `src="https://${HOST}/resource/pic.jpg"`
    );
  });

  it('attributes items with dc:creator but never leaks the owner email', () => {
    const xml = render();

    expect(parse(xml).getElementsByTagName('dc:creator')[0]?.textContent).toBe('Alice A');
    expect(xml).not.toContain('alice@example.com');
  });

  it('links to the comments feed only when the item has comments', () => {
    expect(parse(render()).querySelector('item > comments')).toBeNull();

    const doc = parse(render([content({ commentsCount: 3 })]));
    expect(doc.querySelector('item > comments')?.textContent).toBe(
      `https://${HOST}/api/social/comments?resource=${encodeURIComponent(`https://${HOST}/alice/blog/hello`)}`
    );
  });

  it('renders the license as a copyright line', () => {
    const doc = parse(render([content()], user({ license: 'http://www.opensource.org/licenses/mit-license.php' })));

    expect(doc.querySelector('channel > copyright')?.textContent).toBe(
      'MIT License: http://www.opensource.org/licenses/mit-license.php'
    );
  });

  it('renders an empty feed without items', () => {
    const doc = parse(render([]));

    expect(doc.querySelectorAll('item')).toHaveLength(0);
    expect(doc.querySelector('channel > title')?.textContent).toBe("Alice's site");
  });

  it('escapes markup in titles', () => {
    const doc = parse(render([content({ title: 'a & b <c>' })]));

    expect(doc.querySelector('item > title')?.textContent).toBe('a & b <c>');
  });
});
