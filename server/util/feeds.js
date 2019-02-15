import cheerio from 'cheerio';
import FeedParser from 'feedparser';
import fetch from 'node-fetch';
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

  if (feedUrl.startsWith('/')) {
    const parsedUrl = new URL(websiteUrl);
    feedUrl = `${parsedUrl.origin}${feedUrl}`;
  }

  return await retrieveFeed(feedUrl);
}

export async function retrieveFeed(feedUrl) {
  const response = await fetchUrl(feedUrl);
  return await response.text();
}

async function fetchUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'hello, world bot.',
      },
    });
    if (response.status !== 200) {
      throw new NotFoundError();
    }
    return response;
  } catch (ex) {
    throw ex;
  }
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

export async function mapFeedEntriesToModelEntries(feedEntries, userRemote) {
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

  return {
    creator: feedEntry.author,
    createdAt: feedEntry.pubdate || new Date(),
    updatedAt: dateUpdated,
    from_user: userRemote.profile_url,
    link: feedEntry.link || feedEntry.permalink,
    post_id: entryId,
    title: feedEntry.title || 'untitled',
    to_username: userRemote.local_username,
    type: 'post',
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
