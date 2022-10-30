import { ContentRemote, UserRemote } from '@prisma/client';
import { Readable, ReadableOptions } from 'stream';
import { createAbsoluteUrl, fetchText, fetchUrl, sanitizeHTML } from 'util/crawler';
import { getRemoteContent, saveRemoteContent } from './db';

import FeedParser from 'feedparser';
import { HTTPError } from 'util/exceptions';
import cheerio from 'cheerio';

export async function discoverAndParseFeedFromUrl(url: string) {
  const { content, feedUrl } = await discoverAndRetrieveFeedFromUrl(url);
  const { feedEntries, feedMeta } = await parseFeed(content);

  return { feedEntries, feedMeta, feedUrl };
}

async function discoverAndRetrieveFeedFromUrl(url: string) {
  const response = await fetchUrl(url);
  const content = await response.text();

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/html')) {
    return await parseHtmlAndRetrieveFeed(url, content);
  }

  // The url is the feed already, just send that back.
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
    const { feedEntries } = await parseFeed(feedResponseText);
    await mapFeedAndInsertIntoDb(userRemote, feedEntries);
  } catch (ex) {
    console.error(`${userRemote.localUsername} - ${userRemote.profileUrl}: parseFeed FAILED.\n${ex}`);
  }
}

export async function mapFeedAndInsertIntoDb(userRemote: UserRemote, feedEntries: FeedParser.Node[]) {
  let newEntries: ContentRemote[] = [];
  let skippedCount = 0;
  try {
    [newEntries, skippedCount] = (await mapFeedEntriesToModelEntries(feedEntries, userRemote)) as [
      ContentRemote[],
      number
    ];
    console.info(
      `${userRemote.localUsername} - ${userRemote.profileUrl}: ` +
        `parsed ${newEntries.length} entries, skipped ${skippedCount}.`
    );
  } catch (ex) {
    console.error(`${userRemote.localUsername} - ${userRemote.profileUrl}: mapFeed FAILED.\n${ex}`);
    return;
  }

  try {
    newEntries.length && (await saveRemoteContent(newEntries));
    console.info(
      `${userRemote.localUsername} - ${userRemote.profileUrl}: inserted ${newEntries.length} entries into db.`
    );
  } catch (ex: any) {
    console.error(`${userRemote.localUsername} - ${userRemote.profileUrl}: db insertion failed.\n${ex.stack}`);
  }
}

export async function retrieveFeed(feedUrl: string) {
  return await fetchText(feedUrl);
}

export async function parseFeed(content: string) {
  const { feedEntries, feedMeta }: { feedEntries: FeedParser.Node[]; feedMeta: FeedParser.Node } = await new Promise(
    (resolve, reject) => {
      const feedEntries: string[] = [];
      new TextStream({}, content)
        .pipe(new FeedParser({}))
        .on('error', function (error: any) {
          reject(`FeedParser failed to parse feed: ${error}`);
        })
        .on('readable', function () {
          try {
            // @ts-ignore meh.
            let feedEntry = this.read();
            while (feedEntry) {
              feedEntries.push(feedEntry);
              // @ts-ignore meh.
              feedEntry = this.read();
            }
          } catch (ex) {
            // @ts-ignore
            reject(ex.message);
          }
        })
        .on('end', function () {
          // @ts-ignore meh.
          resolve({ feedEntries, feedMeta: this.meta });
        });
    }
  );

  return { feedEntries, feedMeta };
}

async function mapFeedEntriesToModelEntries(feedEntries: FeedParser.Node[], userRemote: UserRemote) {
  const entries = await Promise.all(feedEntries.map(async (feedEntry) => await handleEntry(feedEntry, userRemote)));
  const filteredEntries = entries.filter((entry) => entry);
  const skippedCount = entries.length - filteredEntries.length;

  return [filteredEntries, skippedCount];
}

const FEED_MAX_DAYS_OLD = 30 * 24 * 60 * 60 * 1000; // 30 days
async function handleEntry(feedEntry: FeedParser.Node, userRemote: UserRemote): Promise<Partial<ContentRemote> | null> {
  const entryId = feedEntry.guid || feedEntry.link || feedEntry.permalink;
  const link = feedEntry.link || feedEntry.permalink;

  const existingModelEntry = await getRemoteContent(userRemote.localUsername, entryId);

  let dateUpdated = new Date();
  if (feedEntry.date) {
    dateUpdated = new Date(feedEntry.date);
  } else if (feedEntry.pubdate) {
    dateUpdated = new Date(feedEntry.pubdate);
  }

  // We ignore if we already have the item in our DB and it hasn't been updated.
  // Also, we don't keep items that are over feedMaxDaysOld.
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

  // XXX(mime): A shortcoming of feedparser currently is that it doesn't resolve relative urls for feeds that have
  // urls in the content, e.g. kottke.org Fix this hackily for now. It should really be looking at xml:base in the XML.
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

  // Comments and threads
  let commentsCount = 0;
  let commentsUpdated = null;
  const atomLinks = feedEntry['atom:link'] ? [feedEntry['atom:link']].flat(1) : [];
  const replies = atomLinks.find((el) => el['@'].rel === 'replies');
  if (replies) {
    commentsCount = parseInt(replies['@'].count);
    commentsUpdated = new Date(replies['@'].updated);
  }
  const thread = feedEntry['thr:in-reply-to']?.['@'].ref;

  // Avatar
  const pocoPhotos = feedEntry['atom:author']?.['poco:photos'];
  const avatar = pocoPhotos && pocoPhotos['poco:value']['#'];

  return {
    id: existingModelEntry?.id || undefined,
    avatar,
    commentsCount,
    commentsUpdated,
    content: '',
    createdAt: feedEntry.pubdate || new Date(),
    creator: feedEntry.author,
    fromUsername: userRemote.profileUrl,
    fromUserRemoteId: userRemote.id.toString(),
    link,
    postId: entryId,
    thread,
    title: feedEntry.title || 'untitled',
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
