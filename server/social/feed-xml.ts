import type { Content, ContentRemote, User } from '../../generated/prisma/client';
import { buildUrl, contentUrl, profileUrl } from '../../lib/url-factory';
import constants, { WEB_SUB_HUB } from '../../util/constants';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function attrs(o: Record<string, unknown>): string {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join('');
}

function authorXml(host: string, contentOwner: User): string {
  const profile = profileUrl(contentOwner.username, host);
  return (
    `<author>` +
    `<activity:object-type>http://activitystrea.ms/schema/1.0/person</activity:object-type>` +
    `<name>${esc(contentOwner.name)}</name>` +
    `<uri>${esc(profile)}</uri>` +
    `<email>${esc(contentOwner.email)}</email>` +
    `<poco:preferredusername>${esc(contentOwner.username)}</poco:preferredusername>` +
    `<poco:displayname>${esc(contentOwner.name)}</poco:displayname>` +
    `<poco:emails><poco:value>${esc(contentOwner.email)}</poco:value><poco:type>home</poco:type><poco:primary>true</poco:primary></poco:emails>` +
    `<poco:urls><poco:value>${esc(profile)}</poco:value><poco:type>profile</poco:type><poco:primary>true</poco:primary></poco:urls>` +
    `</author>`
  );
}

function entryXml(host: string, content: Content): string {
  const statsImgSrc = buildUrl({
    host,
    pathname: '/api/stats',
    searchParams: { resource: contentUrl(content, undefined, host) },
  });
  const absoluteUrlReplacement = buildUrl({ host, pathname: '/resource' });
  const html =
    content.view.replace(/(['"])\/resource/gm, `$1${absoluteUrlReplacement}`) + `<img src="${statsImgSrc}" />`;
  const url = contentUrl(content, undefined, host);
  const repliesUrl = buildUrl({ host, pathname: '/api/social/comments', searchParams: { resource: url } });

  let objectType: string;
  if (content.section === 'comments') {
    objectType =
      `<activity:object-type>http://activitystrea.ms/schema/1.0/comment</activity:object-type>` +
      (content.thread ? `<thr:in-reply-to ref="${esc(content.thread)}"/>` : '') +
      (content.threadUser
        ? `<link rel="ostatus:attention" href="${esc(content.threadUser)}"/><link rel="mentioned" href="${esc(content.threadUser)}"/>`
        : '');
  } else {
    objectType = `<activity:object-type>http://activitystrea.ms/schema/1.0/article</activity:object-type>`;
  }

  return (
    `<entry>` +
    `<title>${esc(content.title || '(untitled)')}</title>` +
    `<link href="${esc(url)}"/>` +
    `<id>${esc(url)}</id>` +
    `<content type="html"><![CDATA[${html}]]></content>` +
    `<published>${new Date(content.createdAt || '').toISOString()}</published>` +
    `<updated>${new Date(content.updatedAt || '').toISOString()}</updated>` +
    `<activity:verb>http://activitystrea.ms/schema/1.0/post</activity:verb>` +
    objectType +
    (content.commentsCount
      ? `<link rel="replies" type="application/atom+xml" href="${esc(repliesUrl)}"${attrs({
          'thr:count': content.commentsCount,
          'thr:updated': content.commentsUpdated ? new Date(content.commentsUpdated).toISOString() : undefined,
        })}/>`
      : '') +
    `</entry>`
  );
}

function commentXml(host: string, resource: string, comment: ContentRemote): string {
  const tagDate = new Date().toISOString().slice(0, 10);
  const threadUrl = `tag:${host},${tagDate}:${resource}`;
  return (
    `<entry>` +
    `<link href="${esc(comment.link)}"/>` +
    `<id>${esc(comment.postId)}</id>` +
    `<author><name>${esc(comment.username)}</name>` +
    (comment.fromUsername ? `<uri>${esc(comment.fromUsername)}</uri>` : '') +
    `<poco:photos><poco:value>${esc(comment.avatar)}</poco:value><poco:type>thumbnail</poco:type></poco:photos>` +
    `</author>` +
    `<content type="html"><![CDATA[${comment.view}]]></content>` +
    `<published>${new Date(comment.createdAt || '').toISOString().slice(0, 10)}</published>` +
    `<activity:verb>http://activitystrea.ms/schema/1.0/post</activity:verb>` +
    `<activity:object-type>http://activitystrea.ms/schema/1.0/comment</activity:object-type>` +
    `<thr:in-reply-to ref="${esc(threadUrl)}"/>` +
    `</entry>`
  );
}

function feedShell(
  host: string,
  reqUrl: string,
  contentOwner: User,
  updatedAt: Date | null | undefined,
  entries: string
): string {
  const feedUrl = buildUrl({ host, pathname: reqUrl });
  const salmonUrl = buildUrl({
    host,
    pathname: '/api/social/salmon',
    searchParams: { resource: profileUrl(contentOwner.username, host) },
  });
  const ns = attrs({
    'xml:lang': 'en-US',
    xmlns: 'http://www.w3.org/2005/Atom',
    'xmlns:activity': 'http://activitystrea.ms/spec/1.0/',
    'xmlns:poco': 'http://portablecontacts.net/spec/1.0',
    'xmlns:media': 'http://purl.org/syndication/atommedia',
    'xmlns:thr': 'http://purl.org/syndication/thread/1.0',
  });

  let rights = '';
  if (contentOwner.license) {
    rights =
      contentOwner.license === 'http://purl.org/atompub/license#unspecified'
        ? `<rights>Copyright ${new Date().getFullYear()} by ${esc(contentOwner.name)}</rights>`
        : `<rights>${esc(constants.licenses[contentOwner.license as keyof typeof constants.licenses]?.['name'])}: ${esc(contentOwner.license)}</rights>`;
  }

  return (
    `<feed${ns}>` +
    `<generator uri="https://github.com/mimecuvalo/helloworld">Hello, world.</generator>` +
    `<id>${esc(feedUrl)}</id>` +
    `<title>${esc(contentOwner.title)}</title>` +
    `<subtitle>a hello world site.</subtitle>` +
    `<link rel="self" href="${esc(feedUrl)}"/>` +
    `<link rel="alternate" type="text/html" href="${esc(profileUrl(contentOwner.username, host))}"/>` +
    `<link rel="hub" href="${esc(WEB_SUB_HUB)}"/>` +
    `<link rel="salmon" href="${esc(salmonUrl)}"/>` +
    `<link rel="http://salmon-protocol.org/ns/salmon-replies" href="${esc(salmonUrl)}"/>` +
    `<link rel="http://salmon-protocol.org/ns/salmon-mention" href="${esc(salmonUrl)}"/>` +
    `<link rel="license" href="${esc(contentOwner.license || '')}"/>` +
    rights +
    (updatedAt ? `<updated>${new Date(updatedAt).toISOString()}</updated>` : '') +
    authorXml(host, contentOwner) +
    (contentOwner.logo ? `<logo>${esc(buildUrl({ host, pathname: contentOwner.logo }))}</logo>` : '') +
    `<icon>${esc(buildUrl({ host, pathname: contentOwner.favicon || '/favicon.jpg' }))}</icon>` +
    entries +
    `</feed>`
  );
}

export function renderFeed(host: string, reqUrl: string, feed: Content[], contentOwner: User): string {
  const updatedAt = feed.length ? feed[0].updatedAt : new Date();
  const entries = feed.map((content) => entryXml(host, content)).join('');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet href="/rss.xsl" type="text/xsl"?>\n` +
    feedShell(host, reqUrl, contentOwner, updatedAt, entries)
  );
}

export function renderComments(
  host: string,
  reqUrl: string,
  resource: string,
  comments: ContentRemote[],
  contentOwner: User
): string {
  const entries = comments.map((comment) => commentXml(host, resource, comment)).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>` + feedShell(host, reqUrl, contentOwner, undefined, entries);
}
