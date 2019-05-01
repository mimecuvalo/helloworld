import cheerio from 'cheerio';
import FeedParser from 'feedparser';
import { fetchUrl, createAbsoluteUrl } from './crawler';
import models from '../data/models'; // TODO(mime): code smell that we should have models in a util file.
import { NotFoundError } from '../util/exceptions';
import { Readable } from 'stream';
import sanitizeHTML from 'sanitize-html';

export const FEED_MAX_DAYS_OLD = 30 * 24 * 60 * 60 * 1000;

export async function discoverAndParseFeedFromUrl(url) {
  const content = await discoverAndRetrieveFeedFromUrl(url);
  const { feedEntries, feedMeta } = await parseFeed(content);

  return { feedEntries, feedMeta };
}

async function discoverAndRetrieveFeedFromUrl(url) {
  const response = await fetchUrl(url);
  const content = await response.text();

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/html')) {
    return await parseHtmlAndRetrieveFeed(url, content);
  }

  // The url is the feed already, just send that back.
  return content;
}

async function parseHtmlAndRetrieveFeed(websiteUrl, html) {
  const $ = cheerio.load(html);
  const links = $('link[rel="alternate"]').filter((index, el) => ($(el).attr('type') || '').match(/(rss|atom)/));

  let feedUrl = links.first().attr('href');
  if (!feedUrl) {
    throw new NotFoundError();
  }

  feedUrl = createAbsoluteUrl(websiteUrl, feedUrl);

  return await retrieveFeed(feedUrl);
}

export async function parseFeedAndInsertIntoDb(userRemote, feedResponseText, logger) {
  try {
    const { feedEntries } = await parseFeed(feedResponseText);
    await mapFeedAndInsertIntoDb(userRemote, feedEntries, logger);
  } catch (ex) {
    logger && logger.error(`${userRemote.local_username} - ${userRemote.profile_url}: parseFeed FAILED.\n${ex}`);
  }
}

export async function mapFeedAndInsertIntoDb(userRemote, feedEntries, logger) {
  let newEntries, skippedCount;
  try {
    [newEntries, skippedCount] = await mapFeedEntriesToModelEntries(feedEntries, userRemote);
    logger &&
      logger.info(
        `${userRemote.local_username} - ${userRemote.profile_url}: ` +
          `parsed ${newEntries.length} entries, skipped ${skippedCount}.`
      );
  } catch (ex) {
    logger && logger.error(`${userRemote.local_username} - ${userRemote.profile_url}: mapFeed FAILED.\n${ex}`);
    return;
  }

  try {
    newEntries.length &&
      (await models.Content_Remote.bulkCreate(newEntries, { ignoreDuplicates: true, validate: true }));
    logger &&
      logger.info(
        `${userRemote.local_username} - ${userRemote.profile_url}: inserted ${newEntries.length} entries into db.`
      );
  } catch (ex) {
    logger &&
      logger.error(`${userRemote.local_username} - ${userRemote.profile_url}: db insertion failed.\n${ex.stack}`);
  }
}

export async function retrieveFeed(feedUrl) {
  const response = await fetchUrl(feedUrl);
  return await response.text();
}

export async function parseFeed(content) {
  const { feedEntries, feedMeta } = await new Promise((resolve, reject) => {
    const feedEntries = [];
    new TextStream({}, content)
      .pipe(new FeedParser())
      .on('error', function(error) {
        reject(`FeedParser failed to parse feed: ${error}`);
      })
      .on('readable', function() {
        try {
          let feedEntry = this.read();
          while (feedEntry) {
            feedEntries.push(feedEntry);
            feedEntry = this.read();
          }
        } catch (ex) {
          reject(ex.message);
        }
      })
      .on('end', function() {
        resolve({ feedEntries, feedMeta: this.meta });
      });
  });

  return { feedEntries, feedMeta };
}

async function mapFeedEntriesToModelEntries(feedEntries, userRemote) {
  const entries = await Promise.all(feedEntries.map(async feedEntry => await handleEntry(feedEntry, userRemote)));
  const filteredEntries = entries.filter(entry => entry);
  const skippedCount = entries.length - filteredEntries.length;

  return [filteredEntries, skippedCount];
}

async function handleEntry(feedEntry, userRemote) {
  const entryId = feedEntry.guid || feedEntry.link || feedEntry.permalink;

  const existingModelEntry = await models.Content_Remote.findOne({
    where: {
      to_username: userRemote.local_username,
      post_id: entryId,
    },
  });

  let dateUpdated = new Date();
  if (feedEntry.date) {
    dateUpdated = new Date(feedEntry.date);
  } else if (feedEntry.pubdate) {
    dateUpdated = new Date(feedEntry.pubdate);
  }

  // We ignore if we already have the item in our DB.
  // Also, we don't keep items that are over FEED_MAX_DAYS_OLD.
  if (
    existingModelEntry?.type === 'comment' ||
    (existingModelEntry && +existingModelEntry.updatedAt === +dateUpdated) ||
    dateUpdated < new Date(Date.now() - FEED_MAX_DAYS_OLD)
  ) {
    return;
  }

  let view = sanitizeHTML(feedEntry.description || feedEntry.summary, {
    allowedTags: sanitizeHTML.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'title'],
      img: ['src', 'srcset', 'width', 'height', 'alt', 'title'],
      iframe: ['src', 'width', 'height', 'alt', 'title'],
    },
  });

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
  view = view.replace(RELATIVE_REGEXP, `$1$2${userRemote.profile_url}/`);

  // Comments and threads
  let comments_count = 0;
  let comments_updated = undefined;
  const atomLinks = feedEntry['atom:link'];
  const replies = atomLinks && atomLinks instanceof Array && atomLinks?.find(el => el['@'].rel === 'replies');
  if (replies) {
    comments_count = parseInt(replies['@'].count);
    comments_updated = new Date(replies['@'].updated);
  }
  const thread = feedEntry['thr:in-reply-to']?.['@'].ref;

  // Avatar
  const pocoPhotos = feedEntry['atom:author']?.['poco:photos'];
  const avatar = pocoPhotos && pocoPhotos['poco:value']['#'];

  return {
    id: existingModelEntry ? existingModelEntry.id : undefined,
    avatar,
    comments_count,
    comments_updated,
    createdAt: feedEntry.pubdate || new Date(),
    creator: feedEntry.author,
    from_user: userRemote.profile_url,
    from_user_remote_id: userRemote.id,
    link: feedEntry.link || feedEntry.permalink,
    post_id: entryId,
    thread,
    title: feedEntry.title || 'untitled',
    to_username: userRemote.local_username,
    type: 'post',
    updatedAt: dateUpdated,
    username: userRemote.username,
    view,
  };
}

class TextStream extends Readable {
  constructor(options, text) {
    super(options);
    this.text = text;
  }

  _read() {
    this.push(this.text);
    this.push(null);
  }
}
