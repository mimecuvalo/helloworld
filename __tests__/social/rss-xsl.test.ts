import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The stylesheet that renders both /api/social/feed (Atom) and
// /api/social/rss (RSS 2.0) in a browser.
//
// Browsers ship an XSLT *1.0* processor and nothing newer. A stylesheet that
// reaches for XPath 2.0 still parses as XML and still passes every other test
// here — it just fails to compile in the browser, and the reader sees raw XML
// instead of the styled page. So this guards the dialect explicitly.
const xsl = readFileSync(path.join(process.cwd(), 'public/rss.xsl'), 'utf8');

describe('public/rss.xsl', () => {
  it('is well-formed XML', () => {
    const doc = new DOMParser().parseFromString(xsl, 'application/xml');

    expect(doc.querySelector('parsererror')).toBeNull();
  });

  it('declares XSLT 1.0, which is all any browser implements', () => {
    expect(xsl).toMatch(/<xsl:stylesheet[^>]*version="1\.0"/);
  });

  it('uses no XPath 2.0 constructs in its expressions', () => {
    const expressions = [...xsl.matchAll(/(?:select|test|match)="([^"]*)"/g)].map((match) => match[1]);
    expect(expressions.length).toBeGreaterThan(0);

    // `if (…) then … else …` is the one that bit us; the rest are neighbours
    // that would fail the same way.
    const xpath2 = expressions.filter((expression) =>
      /\bif\s*\(|\bthen\b|\belse\b|\bfor\s+\$|\bevery\b|\bsome\b|\bcastable\b|\binstance\s+of\b/.test(expression)
    );
    expect(xpath2).toEqual([]);
  });

  it('reads both feed shapes for every value it renders', () => {
    // Each union has an Atom side and an RSS side; only one exists per document.
    expect(xsl).toContain('/atom:feed/atom:title | /rss/channel/title');
    expect(xsl).toContain('/atom:feed/atom:subtitle | /rss/channel/description');
    expect(xsl).toContain('/atom:feed/atom:entry | /rss/channel/item');
    expect(xsl).toContain('atom:link/@href | link');
    expect(xsl).toContain('atom:title | title');
  });

  it('branches on the date format, which the two feeds do not share', () => {
    // Atom is ISO-8601, RSS is RFC-822 — different substring lengths.
    expect(xsl).toContain('substring(atom:published, 1, 10)');
    expect(xsl).toContain('substring(pubDate, 1, 16)');
  });

  it('has no hardcoded site title left in it', () => {
    // It used to render a literal "nightlight.rocks" for every tenant.
    expect(xsl).not.toContain('nightlight.rocks');
  });
});
