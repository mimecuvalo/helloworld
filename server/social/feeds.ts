import type { ContentRemote, UserRemote } from '../../generated/prisma/client';
import { Readable, type ReadableOptions } from 'stream';
import { createAbsoluteUrl, fetchText, fetchUrl, sanitizeHTML } from '../crawler';
import { getRemoteContent, saveRemoteContent } from './db';
import FeedParser from 'feedparser';
import { HTTPError } from '../exceptions';
import * as cheerio from 'cheerio';

export async function discoverAndParseFeedFromUrl(url: string) {
  const { content, feedUrl } = await discoverAndRetrieveFeedFromUrl(url);
  const { feedEntries, feedMeta } = await parseFeed(content, feedUrl);
  return { feedEntries, feedMeta, feedUrl };
}

async function discoverAndRetrieveFeedFromUrl(url: string) {
  const response = await fetchUrl(url);
  const content = await response.text();

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/html')) {
    return await parseHtmlAndRetrieveFeed(url, content);
  }
  return { content, feedUrl: url };
}

async function parseHtmlAndRetrieveFeed(websiteUrl: string, html: string) {
  const $ = cheerio.load(html);
  const links = $('link[rel="alternate"]').filter((index, el) => !!($(el).attr('type') || '').match(/(rss|atom)/));

  let feedUrl = links.first().attr('href');
  if (!feedUrl) {
    throw new HTTPError(404, websiteUrl, 'feed: no feed url');
  }

  feedUrl = createAbsoluteUrl(websiteUrl, feedUrl);
  const content = await retrieveFeed(feedUrl);
  return { content, feedUrl };
}

export async function parseFeedAndInsertIntoDb(userRemote: UserRemote, feedResponseText: string) {
  try {
    const { feedEntries } = await parseFeed(feedResponseText, userRemote.feedUrl);
    await mapFeedAndInsertIntoDb(userRemote, feedEntries);
  } catch (ex) {
    console.error(`${userRemote.localUsername} - ${userRemote.profileUrl}: parseFeed FAILED.\n${ex}`);
  }
}

export async function mapFeedAndInsertIntoDb(userRemote: UserRemote, feedEntries: FeedParser.Item[]) {
  let newEntries: ContentRemote[] = [];
  let skippedCount = 0;
  try {
    [newEntries, skippedCount] = (await mapFeedEntriesToModelEntries(feedEntries, userRemote)) as [
      ContentRemote[],
      number,
    ];
    console.debug(
      `${userRemote.localUsername} - ${userRemote.profileUrl}: parsed ${newEntries.length} entries, skipped ${skippedCount}.`
    );
  } catch (ex) {
    console.error(`${userRemote.localUsername} - ${userRemote.profileUrl}: mapFeed FAILED.\n${ex}`);
    return;
  }

  try {
    if (newEntries.length) {
      await saveRemoteContent(newEntries);
    }
    console.debug(
      `${userRemote.localUsername} - ${userRemote.profileUrl}: inserted ${newEntries.length} entries into db.`
    );
  } catch (ex) {
    console.error(
      `${userRemote.localUsername} - ${userRemote.profileUrl}: db insertion failed.\n${(ex as Error).stack}`
    );
  }
}

export async function retrieveFeed(feedUrl: string) {
  return await fetchText(feedUrl);
}

export async function parseFeed(content: string, feedUrl?: string) {
  const { feedEntries, feedMeta }: { feedEntries: FeedParser.Item[]; feedMeta: FeedParser.Meta } = await new Promise(
    (resolve, reject) => {
      const feedEntries: FeedParser.Item[] = [];
      new TextStream({}, content)
        .pipe(new FeedParser(feedUrl ? { feedurl: feedUrl } : {}))
        .on('error', function (error: unknown) {
          reject(`FeedParser failed to parse feed: ${error}`);
        })
        .on('readable', function (this: FeedParser) {
          try {
            let feedEntry = this.read();
            while (feedEntry) {
              feedEntries.push(feedEntry);
              feedEntry = this.read();
            }
          } catch (ex) {
            reject((ex as Error).message);
          }
        })
        .on('end', function (this: FeedParser) {
          resolve({ feedEntries, feedMeta: this.meta });
        });
    }
  );

  return { feedEntries, feedMeta };
}

async function mapFeedEntriesToModelEntries(feedEntries: FeedParser.Item[], userRemote: UserRemote) {
  const entries = await Promise.all(feedEntries.map(async (feedEntry) => await handleEntry(feedEntry, userRemote)));
  const filteredEntries = entries.filter((entry) => entry);
  const skippedCount = entries.length - filteredEntries.length;
  return [filteredEntries, skippedCount];
}

const FEED_MAX_DAYS_OLD = 30 * 24 * 60 * 60 * 1000; // 30 days
async function handleEntry(feedEntry: FeedParser.Item, userRemote: UserRemote): Promise<Partial<ContentRemote> | null> {
  const entryId = feedEntry.guid || feedEntry.link || feedEntry.permalink;
  const link = feedEntry.link || feedEntry.permalink;

  const existingModelEntry = await getRemoteContent(userRemote.localUsername, entryId);

  let dateUpdated = new Date();
  if (feedEntry.date) {
    dateUpdated = new Date(feedEntry.date);
  } else if (feedEntry.pubdate) {
    dateUpdated = new Date(feedEntry.pubdate);
  }

  if (
    existingModelEntry?.type === 'comment' ||
    (existingModelEntry && +(existingModelEntry.updatedAt || 0) === +dateUpdated) ||
    dateUpdated < new Date(Date.now() - FEED_MAX_DAYS_OLD)
  ) {
    return null;
  }

  let view = feedEntry.description || feedEntry.summary;

  const thumbnail = feedEntry['media:group']?.['media:thumbnail']?.['@']['url'];
  if (!view && thumbnail) {
    view = `<a href="${link}" target="_blank" rel="noopener noreferrer"><img src="${thumbnail}" alt="thumbnail" /></a>`;
  }

  view = sanitizeHTML(view);

  // feedparser doesn't resolve relative urls; hackily prefix with the profile url.
  const HTML_ATTRIBUTES_WITH_LINKS = [
    'action',
    'background',
    'cite',
    'classid',
    'codebase',
    'href',
    'longdesc',
    'profile',
    'src',
    'usemap',
  ];
  const RELATIVE_REGEXP = new RegExp(`(${HTML_ATTRIBUTES_WITH_LINKS.join('|')})(=['"])/`, 'gi');
  view = view.replace(RELATIVE_REGEXP, `$1$2${userRemote.profileUrl}/`);

  let commentsCount = 0;
  let commentsUpdated: Date | null = null;
  const atomLinks = feedEntry['atom:link'] ? [feedEntry['atom:link']].flat(1) : [];
  const replies = atomLinks.find((el) => el['@'].rel === 'replies');
  if (replies) {
    commentsCount = parseInt(replies['@'].count);
    commentsUpdated = new Date(replies['@'].updated);
  }
  const thread = feedEntry['thr:in-reply-to']?.['@'].ref;

  const pocoPhotos = feedEntry['atom:author']?.['poco:photos'];
  const avatar = pocoPhotos && pocoPhotos['poco:value']['#'];

  const title = (feedEntry.title || 'untitled')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…');

  return {
    id: existingModelEntry?.id || undefined,
    avatar,
    commentsCount,
    commentsUpdated,
    createdAt: feedEntry.pubdate || new Date(),
    creator: feedEntry.author,
    fromUsername: userRemote.profileUrl,
    fromUserRemoteId: userRemote.id.toString(),
    link,
    postId: entryId,
    thread,
    title,
    toUsername: userRemote.localUsername,
    type: 'post',
    updatedAt: dateUpdated,
    username: userRemote.username,
    view,
  };
}

class TextStream extends Readable {
  text: string;

  constructor(options: ReadableOptions, text: string) {
    super(options);
    this.text = text;
  }

  _read() {
    this.push(this.text);
    this.push(null);
  }
}
