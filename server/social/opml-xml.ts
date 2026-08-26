import type { User, UserRemote } from '../../generated/prisma/client';
import { profileUrl } from '../../lib/url-factory';
import { attrs, esc, rfc822 } from './xml';

// The blogroll as OPML 2.0 — the interchange format every feed reader knows how
// to import. It's the mirror image of the Atom/RSS feeds: those publish what
// this site *writes*, this publishes what it *reads*.
//
// Peers followed over AT Protocol have no feed to subscribe to (Bluesky serves
// no RSS), so they can't be `type="rss"` outlines. They're listed in their own
// group as `type="link"` outlines, which readers that don't understand them
// ignore instead of trying to fetch as a feed.

function outline(userRemote: UserRemote): string {
  const text = userRemote.name || userRemote.username;
  const isAtproto = !userRemote.feedUrl;
  return (
    `<outline` +
    attrs({
      text,
      title: text,
      ...(isAtproto
        ? { type: 'link', url: userRemote.profileUrl }
        : { type: 'rss', xmlUrl: userRemote.feedUrl, htmlUrl: userRemote.profileUrl }),
    }) +
    `/>`
  );
}

function group(title: string, following: UserRemote[]): string {
  if (!following.length) return '';
  return `<outline${attrs({ text: title, title })}>${following.map(outline).join('')}</outline>`;
}

export function renderOpml(host: string, user: User, following: UserRemote[], now = new Date()): string {
  const owner = user.name || user.title || user.username;
  const feeds = following.filter((userRemote) => !!userRemote.feedUrl);
  const links = following.filter((userRemote) => !userRemote.feedUrl);

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<opml version="2.0">` +
    `<head>` +
    `<title>Feeds for ${esc(owner)}'s blogroll</title>` +
    `<dateCreated>${esc(rfc822(now))}</dateCreated>` +
    `<ownerName>${esc(owner)}</ownerName>` +
    `<ownerId>${esc(profileUrl(user.username, host))}</ownerId>` +
    `</head>` +
    `<body>` +
    group('Blogs', feeds) +
    group('Bluesky', links) +
    `</body>` +
    `</opml>`
  );
}
