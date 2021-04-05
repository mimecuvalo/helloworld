import cheerio from 'cheerio';
import FeedParser from 'feedparser';
import { fetchText, fetchUrl, createAbsoluteUrl, sanitizeHTML } from './crawler';
import { HTTPError } from './exceptions';
import { Readable } from 'stream';

export async function discoverAndParseFeedFromUrl(url) {
  const { content, feedUrl } = await discoverAndRetrieveFeedFromUrl(url);
  const { feedEntries, feedMeta } = await parseFeed(content);

  return { feedEntries, feedMeta, feedUrl };
}

async function discoverAndRetrieveFeedFromUrl(url) {
  const response = await fetchUrl(url);
  const content = await response.text();

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/html')) {
    return await parseHtmlAndRetrieveFeed(url, content);
  }

  // The url is the feed already, just send that back.
  return { content, feedUrl: url };
}

async function parseHtmlAndRetrieveFeed(websiteUrl, html) {
  const $ = cheerio.load(html);
  const links = $('link[rel="alternate"]').filter((index, el) => ($(el).attr('type') || '').match(/(rss|atom)/));

  let feedUrl = links.first().attr('href');
  if (!feedUrl) {
    throw new HTTPError(404, websiteUrl, 'feed: no feed url');
  }

  feedUrl = createAbsoluteUrl(websiteUrl, feedUrl);
  const content = await retrieveFeed(feedUrl);
  return { content, feedUrl };
}

export async function parseFeedAndInsertIntoDb(options, userRemote, feedResponseText, logger) {
  try {
    const { feedEntries } = await parseFeed(feedResponseText);
    await mapFeedAndInsertIntoDb(options, userRemote, feedEntries, logger);
  } catch (ex) {
    logger && logger.error(`${userRemote.local_username} - ${userRemote.profile_url}: parseFeed FAILED.\n${ex}`);
  }
}

export async function mapFeedAndInsertIntoDb(options, userRemote, feedEntries, logger) {
  let newEntries, skippedCount;
  try {
    [newEntries, skippedCount] = await mapFeedEntriesToModelEntries(options, feedEntries, userRemote);
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
    newEntries.length && (await options.saveRemoteContent(newEntries));
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
  return await fetchText(feedUrl);
}

export async function parseFeed(content) {
  const { feedEntries, feedMeta } = await new Promise((resolve, reject) => {
    const feedEntries = [];
    new TextStream({}, content)
      .pipe(new FeedParser())
      .on('error', function (error) {
        reject(`FeedParser failed to parse feed: ${error}`);
      })
      .on('readable', function () {
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
      .on('end', function () {
        resolve({ feedEntries, feedMeta: this.meta });
      });
  });

  return { feedEntries, feedMeta };
}

async function mapFeedEntriesToModelEntries(options, feedEntries, userRemote) {
  const entries = await Promise.all(
    feedEntries.map(async (feedEntry) => await handleEntry(options, feedEntry, userRemote))
  );
  const filteredEntries = entries.filter((entry) => entry);
  const skippedCount = entries.length - filteredEntries.length;

  return [filteredEntries, skippedCount];
}

async function handleEntry(options, feedEntry, userRemote) {
  const entryId = feedEntry.guid || feedEntry.link || feedEntry.permalink;
  const link = feedEntry.link || feedEntry.permalink;

  const existingModelEntry = await options.getRemoteContent(userRemote.local_username, entryId);

  let dateUpdated = new Date();
  if (feedEntry.date) {
    dateUpdated = new Date(feedEntry.date);
  } else if (feedEntry.pubdate) {
    dateUpdated = new Date(feedEntry.pubdate);
  }

  // We ignore if we already have the item in our DB.
  // Also, we don't keep items that are over options.feedMaxDaysOld.
  if (
    existingModelEntry?.type === 'comment' ||
    (existingModelEntry && +existingModelEntry.updatedAt === +dateUpdated) ||
    dateUpdated < new Date(Date.now() - options.constants.feedMaxDaysOld)
  ) {
    return;
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
  view = view.replace(RELATIVE_REGEXP, `$1$2${userRemote.profile_url}/`);

  // Comments and threads
  let comments_count = 0;
  let comments_updated;
  const atomLinks = feedEntry['atom:link'] ? [feedEntry['atom:link']].flat(1) : [];
  const replies = atomLinks.find((el) => el['@'].rel === 'replies');
  if (replies) {
    comments_count = parseInt(replies['@'].count);
    comments_updated = new Date(replies['@'].updated);
  }
  const thread = feedEntry['thr:in-reply-to']?.['@'].ref;

  // Avatar
  const pocoPhotos = feedEntry['atom:author']?.['poco:photos'];
  const avatar = pocoPhotos && pocoPhotos['poco:value']['#'];

  return {
    id: existingModelEntry?.id || undefined,
    avatar,
    comments_count,
    comments_updated,
    content: '',
    createdAt: feedEntry.pubdate || new Date(),
    creator: feedEntry.author,
    from_user: userRemote.profile_url,
    from_user_remote_id: userRemote.id,
    link,
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
