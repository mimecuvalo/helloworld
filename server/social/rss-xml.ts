import type { Content, User } from '../../generated/prisma/client';
import { buildUrl, contentUrl, profileUrl } from '../../lib/url-factory';
import constants, { WEB_SUB_HUB } from '../../util/constants';
import { attrs, entryContentHtml, esc, plainTextExcerpt, rfc822 } from './xml';

// RSS 2.0 alongside the Atom feed in feed-xml.ts. Atom stays the canonical
// federation surface (OStatus/WebFinger point at it); this exists so plain-RSS
// readers, which are still most of them, get a feed they can subscribe to.
//
// NB: unlike the Atom author block, nothing here emits the owner's email.

function itemXml(host: string, content: Content, contentOwner: User): string {
  const url = contentUrl(content, undefined, host);
  const html = entryContentHtml(host, content);
  const repliesUrl = buildUrl({ host, pathname: '/api/social/comments', searchParams: { resource: url } });

  return (
    `<item>` +
    `<title>${esc(content.title || '(untitled)')}</title>` +
    `<link>${esc(url)}</link>` +
    `<guid isPermaLink="true">${esc(url)}</guid>` +
    `<pubDate>${esc(rfc822(content.createdAt))}</pubDate>` +
    `<dc:creator>${esc(contentOwner.name)}</dc:creator>` +
    `<description>${esc(plainTextExcerpt(content.view))}</description>` +
    `<content:encoded><![CDATA[${html}]]></content:encoded>` +
    (content.commentsCount ? `<comments>${esc(repliesUrl)}</comments>` : '') +
    `</item>`
  );
}

export function renderRssFeed(host: string, reqUrl: string, feed: Content[], contentOwner: User): string {
  const feedUrl = buildUrl({ host, pathname: reqUrl });
  const profile = profileUrl(contentOwner.username, host);
  const lastBuildDate = feed.length ? feed[0].updatedAt : new Date();
  const ns = attrs({
    version: '2.0',
    'xmlns:atom': 'http://www.w3.org/2005/Atom',
    'xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
    'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
  });

  let copyright = '';
  if (contentOwner.license) {
    copyright =
      contentOwner.license === 'http://purl.org/atompub/license#unspecified'
        ? `<copyright>Copyright ${new Date().getFullYear()} by ${esc(contentOwner.name)}</copyright>`
        : `<copyright>${esc(constants.licenses[contentOwner.license as keyof typeof constants.licenses]?.['name'])}: ${esc(contentOwner.license)}</copyright>`;
  }

  const logo = contentOwner.logo ? buildUrl({ host, pathname: contentOwner.logo }) : '';
  const image = logo
    ? `<image><url>${esc(logo)}</url><title>${esc(contentOwner.title)}</title><link>${esc(profile)}</link></image>`
    : '';

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet href="/rss.xsl" type="text/xsl"?>\n` +
    `<rss${ns}>` +
    `<channel>` +
    `<title>${esc(contentOwner.title)}</title>` +
    `<link>${esc(profile)}</link>` +
    `<description>${esc(contentOwner.description || 'a hello world site.')}</description>` +
    `<language>en-US</language>` +
    `<generator>Hello, world.</generator>` +
    `<atom:link rel="self" type="application/rss+xml" href="${esc(feedUrl)}"/>` +
    `<atom:link rel="hub" href="${esc(WEB_SUB_HUB)}"/>` +
    `<atom:link rel="alternate" type="application/atom+xml" href="${esc(
      buildUrl({ host, pathname: '/api/social/feed', searchParams: { resource: profile } })
    )}"/>` +
    (lastBuildDate ? `<lastBuildDate>${esc(rfc822(lastBuildDate))}</lastBuildDate>` : '') +
    copyright +
    image +
    feed.map((content) => itemXml(host, content, contentOwner)).join('') +
    `</channel>` +
    `</rss>`
  );
}
