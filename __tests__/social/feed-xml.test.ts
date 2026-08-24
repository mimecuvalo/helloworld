import { describe, expect, it } from 'vitest';
import { renderComments, renderFeed } from 'server/social/feed-xml';
import { WEB_SUB_HUB } from 'util/constants';
import { HOST, content, contentRemote, user } from './fixtures';

const REQ = '/api/social/feed?resource=https%3A%2F%2Fexample.com%2Falice';

// The renderers emit XML by hand, so parse the result instead of matching
// substrings: that is what a consuming reader actually has to do.
function parse(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  return doc;
}

describe('renderFeed', () => {
  const render = (feed = [content()], owner = user()) => renderFeed(HOST, REQ, feed, owner);

  it('is well-formed XML with the stylesheet declaration first', () => {
    const xml = render();

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet href="/rss.xsl"')).toBe(true);
    parse(xml);
  });

  it('declares the Atom, activity, poco and thread namespaces', () => {
    const feed = parse(render()).documentElement;

    expect(feed.tagName).toBe('feed');
    expect(feed.getAttribute('xmlns')).toBe('http://www.w3.org/2005/Atom');
    expect(feed.getAttribute('xmlns:activity')).toBe('http://activitystrea.ms/spec/1.0/');
    expect(feed.getAttribute('xmlns:poco')).toBe('http://portablecontacts.net/spec/1.0');
    expect(feed.getAttribute('xmlns:thr')).toBe('http://purl.org/syndication/thread/1.0');
    expect(feed.getAttribute('xml:lang')).toBe('en-US');
  });

  it('points self, hub and salmon at absolute urls', () => {
    const doc = parse(render());
    const href = (rel: string) => doc.querySelector(`feed > link[rel="${rel}"]`)?.getAttribute('href');

    expect(href('self')).toBe(`https://${HOST}${REQ}`);
    expect(href('alternate')).toBe(`https://${HOST}/alice`);
    expect(href('hub')).toBe(WEB_SUB_HUB);
    expect(href('salmon')).toBe(`https://${HOST}/api/social/salmon?resource=https%3A%2F%2Fexample.com%2Falice`);
    expect(doc.querySelector('feed > id')?.textContent).toBe(`https://${HOST}${REQ}`);
  });

  it('advertises both salmon-protocol aliases so OStatus peers can find the endpoint', () => {
    const doc = parse(render());

    for (const rel of [
      'http://salmon-protocol.org/ns/salmon-replies',
      'http://salmon-protocol.org/ns/salmon-mention',
    ]) {
      expect(doc.querySelector(`feed > link[rel="${rel}"]`)?.getAttribute('href')).toContain('/api/social/salmon');
    }
  });

  it('describes the author with poco fields', () => {
    const author = parse(render()).querySelector('feed > author')!;

    expect(author.querySelector('name')?.textContent).toBe('Alice A');
    expect(author.querySelector('uri')?.textContent).toBe(`https://${HOST}/alice`);
    expect(author.getElementsByTagName('poco:preferredusername')[0]?.textContent).toBe('alice');
    expect(author.getElementsByTagName('activity:object-type')[0]?.textContent).toBe(
      'http://activitystrea.ms/schema/1.0/person'
    );
  });

  it('renders an entry as an article with absolute id/link and ISO dates', () => {
    const entry = parse(render()).querySelector('entry')!;

    expect(entry.querySelector('title')?.textContent).toBe('Hello');
    expect(entry.querySelector('id')?.textContent).toBe(`https://${HOST}/alice/blog/hello`);
    expect(entry.querySelector('link')?.getAttribute('href')).toBe(`https://${HOST}/alice/blog/hello`);
    expect(entry.querySelector('published')?.textContent).toBe('2026-02-01T00:00:00.000Z');
    expect(entry.querySelector('updated')?.textContent).toBe('2026-02-02T00:00:00.000Z');
    expect(entry.getElementsByTagName('activity:object-type')[0]?.textContent).toBe(
      'http://activitystrea.ms/schema/1.0/article'
    );
  });

  it('rewrites relative /resource urls to absolute ones and appends the stats pixel', () => {
    const view = `<img src="/resource/a.jpg" /><a href='/resource/b.pdf'>b</a>`;
    const html = parse(render([content({ view })])).querySelector('entry > content')!.textContent!;

    expect(html).toContain(`src="https://${HOST}/resource/a.jpg"`);
    expect(html).toContain(`href='https://${HOST}/resource/b.pdf'`);
    expect(html).not.toMatch(/["']\/resource/);
    expect(html).toContain(`<img src="https://${HOST}/api/stats?resource=`);
  });

  it('marks a comment entry with its thread and mention links', () => {
    const doc = parse(
      render([
        content({
          section: 'comments',
          thread: 'https://remote.example/bob/1',
          threadUser: 'https://remote.example/bob',
        }),
      ])
    );
    const entry = doc.querySelector('entry')!;

    expect(entry.getElementsByTagName('activity:object-type')[0]?.textContent).toBe(
      'http://activitystrea.ms/schema/1.0/comment'
    );
    expect(entry.getElementsByTagName('thr:in-reply-to')[0]?.getAttribute('ref')).toBe('https://remote.example/bob/1');
    expect(entry.querySelector('link[rel="ostatus:attention"]')?.getAttribute('href')).toBe(
      'https://remote.example/bob'
    );
    expect(entry.querySelector('link[rel="mentioned"]')).not.toBeNull();
  });

  it('omits the replies link when an item has no comments', () => {
    expect(parse(render([content({ commentsCount: 0 })])).querySelector('entry link[rel="replies"]')).toBeNull();
  });

  it('links to the comments feed with thr:count when an item has comments', () => {
    const doc = parse(render([content({ commentsCount: 3, commentsUpdated: new Date('2026-02-03T00:00:00.000Z') })]));
    const replies = doc.querySelector('entry link[rel="replies"]')!;

    expect(replies.getAttribute('type')).toBe('application/atom+xml');
    expect(replies.getAttribute('href')).toBe(
      `https://${HOST}/api/social/comments?resource=https%3A%2F%2F${HOST}%2Falice%2Fblog%2Fhello`
    );
    expect(replies.getAttribute('thr:count')).toBe('3');
    expect(replies.getAttribute('thr:updated')).toBe('2026-02-03T00:00:00.000Z');
  });

  it('escapes markup in titles and author names instead of emitting raw XML', () => {
    const xml = render([content({ title: 'a & b <script>' })], user({ name: 'Al "Ice" <b>' }));

    expect(xml).toContain('<title>a &amp; b &lt;script&gt;</title>');
    expect(parse(xml).querySelector('entry > title')?.textContent).toBe('a & b <script>');
    expect(parse(xml).querySelector('feed > author > name')?.textContent).toBe('Al "Ice" <b>');
  });

  it('takes the feed updated stamp from the newest entry', () => {
    const newest = content({ updatedAt: new Date('2026-05-05T00:00:00.000Z') });
    const older = content({ updatedAt: new Date('2026-01-01T00:00:00.000Z') });

    expect(parse(render([newest, older])).querySelector('feed > updated')?.textContent).toBe(
      '2026-05-05T00:00:00.000Z'
    );
  });

  it('still renders a valid empty feed for a user with no content', () => {
    const doc = parse(render([]));

    expect(doc.querySelectorAll('entry')).toHaveLength(0);
    expect(doc.querySelector('feed > title')?.textContent).toBe("Alice's site");
  });

  it('names the rights holder for the unspecified license and the license otherwise', () => {
    const unspecified = parse(render([], user({ license: 'http://purl.org/atompub/license#unspecified' })));
    expect(unspecified.querySelector('rights')?.textContent).toContain('Alice A');

    const mit = parse(render([], user({ license: 'http://www.opensource.org/licenses/mit-license.php' })));
    expect(mit.querySelector('rights')?.textContent).toContain('http://www.opensource.org/licenses/mit-license.php');

    expect(parse(render([], user({ license: null }))).querySelector('rights')).toBeNull();
  });

  it('falls back to the default favicon and omits an absent logo', () => {
    const doc = parse(render([], user({ favicon: null, logo: null })));

    expect(doc.querySelector('icon')?.textContent).toBe(`https://${HOST}/favicon.jpg`);
    expect(doc.querySelector('logo')).toBeNull();
  });

  it('makes the logo absolute when the user has one', () => {
    const doc = parse(render([], user({ logo: '/resource/logo.png' })));

    expect(doc.querySelector('logo')?.textContent).toBe(`https://${HOST}/resource/logo.png`);
  });
});

describe('renderComments', () => {
  const resource = `https://${HOST}/alice/blog/hello`;
  const render = (comments = [contentRemote()]) =>
    renderComments(HOST, '/api/social/comments', resource, comments, user());

  it('is a well-formed Atom feed of comment entries', () => {
    const xml = render();

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><feed')).toBe(true);
    expect(parse(xml).querySelectorAll('entry')).toHaveLength(1);
  });

  it('carries the remote author, avatar and comment verb', () => {
    const entry = parse(render()).querySelector('entry')!;

    expect(entry.querySelector('link')?.getAttribute('href')).toBe('https://remote.example/bob/1');
    expect(entry.querySelector('id')?.textContent).toBe('https://remote.example/bob/1');
    expect(entry.querySelector('author > name')?.textContent).toBe('bob');
    expect(entry.querySelector('author > uri')?.textContent).toBe('https://remote.example/bob');
    expect(entry.getElementsByTagName('poco:value')[0]?.textContent).toBe('https://remote.example/bob.jpg');
    expect(entry.getElementsByTagName('activity:object-type')[0]?.textContent).toBe(
      'http://activitystrea.ms/schema/1.0/comment'
    );
  });

  it('threads every comment against the local resource tag uri', () => {
    const ref = parse(render()).getElementsByTagName('thr:in-reply-to')[0]?.getAttribute('ref');

    expect(ref).toMatch(new RegExp(`^tag:${HOST},\\d{4}-\\d{2}-\\d{2}:${resource.replace(/[/.]/g, '\\$&')}$`));
  });

  it('omits the author uri when the comment has no origin', () => {
    const entry = parse(render([contentRemote({ fromUsername: null })])).querySelector('entry')!;

    expect(entry.querySelector('author > uri')).toBeNull();
    expect(entry.querySelector('author > name')?.textContent).toBe('bob');
  });

  it('has no updated stamp, since a comments feed tracks the parent item', () => {
    expect(parse(render()).querySelector('feed > updated')).toBeNull();
  });

  it('renders an empty comments feed when there are none', () => {
    expect(parse(render([])).querySelectorAll('entry')).toHaveLength(0);
  });
});
