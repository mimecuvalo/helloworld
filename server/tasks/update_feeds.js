import FeedParser from 'feedparser';
import fetch from 'node-fetch';
import models from '../data/models';
import path from 'path';
import { Readable } from 'stream';
import sanitizeHTML from 'sanitize-html';
import Sequelize from 'sequelize';
import winston from 'winston';
import WinstonDailyRotateFile from 'winston-daily-rotate-file';

const MAX_DAYS_OLD = 30 * 24 * 60 * 60 * 1000;

const updateFeedsLogger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new WinstonDailyRotateFile({
      name: 'update-feeds',
      filename: path.resolve(process.cwd(), 'logs', 'update-feeds-%DATE%.log'),
      zippedArchive: true,
    }),
  ],
});

export default async function updateFeeds() {
  await pruneOlderContent();
  await getFreshContent();
}

async function pruneOlderContent() {
  try {
    const rowsDeletedCount = await models.Content_Remote.destroy({
      attributes: ['link'],
      where: {
        type: 'post',
        favorited: false,
        local_content_name: '',
        createdAt: { [Sequelize.Op.lt]: Date.now() - MAX_DAYS_OLD },
      },
    });
    updateFeedsLogger.info(`pruned ${rowsDeletedCount} entries.`);
  } catch (ex) {
    updateFeedsLogger.error(`pruning db error.\n${ex}`);
  }
}

async function getFreshContent() {
  let usersRemote;
  try {
    usersRemote = await models.User_Remote.findAll({
      attributes: ['feed_url', 'local_username', 'profile_url', 'username'],
    });
  } catch (ex) {
    updateFeedsLogger.error(`FAILED to get remote users from db.\n${ex}`);
    return;
  }

  for (const userRemote of usersRemote) {
    let feedResponse;
    try {
      feedResponse = await fetch(userRemote.feed_url, {
        headers: {
          'user-agent': 'hello, world bot.',
        },
      });
      if (feedResponse.status !== 200) {
        updateFeedsLogger.error(
          `${userRemote.local_username} - ${userRemote.profile_url}: fetch FAILED. status: ${feedResponse.status}`
        );
        continue;
      }
      updateFeedsLogger.info(`${userRemote.local_username} - ${userRemote.profile_url}: fetched feed.`);
    } catch (ex) {
      updateFeedsLogger.error(`${userRemote.local_username} - ${userRemote.profile_url}: fetch FAILED.\n${ex}`);
      continue;
    }

    let newEntries, skippedCount;
    try {
      const feedResponseText = await feedResponse.text();
      [newEntries, skippedCount] = await parseFeed(feedResponseText, userRemote);
      updateFeedsLogger.info(
        `${userRemote.local_username} - ${userRemote.profile_url}: ` +
          `parsed ${newEntries.length} entries, skipped ${skippedCount}.`
      );
    } catch (ex) {
      updateFeedsLogger.error(`${userRemote.local_username} - ${userRemote.profile_url}: parseFeed FAILED.\n${ex}`);
      continue;
    }

    try {
      newEntries.length && (await models.Content_Remote.bulkCreate(newEntries, { validate: true }));
      updateFeedsLogger.info(
        `${userRemote.local_username} - ${userRemote.profile_url}: inserted ${newEntries.length} entries into db.`
      );
    } catch (ex) {
      updateFeedsLogger.error(
        `${userRemote.local_username} - ${userRemote.profile_url}: db insertion failed.\n${ex.stack}`
      );
    }
  }
}

async function parseFeed(xml, userRemote) {
  const feedEntries = await new Promise((resolve, reject) => {
    const feedEntries = [];
    new TextStream({}, xml)
      .pipe(new FeedParser())
      .on('error', function(error) {
        reject(`FeedParser failed to parse feed: ${userRemote.feed_url}: ${error}`);
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
        resolve(feedEntries);
      });
  });

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
  // Also, we don't keep items that are over MAX_DAYS_OLD.
  if (
    (existingModelEntry && +existingModelEntry.updatedAt === +dateUpdated) ||
    dateUpdated < new Date(Date.now() - MAX_DAYS_OLD)
  ) {
    return;
  }

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
    view: sanitizeHTML(feedEntry.description || feedEntry.summary, {
      allowedTags: sanitizeHTML.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        a: ['href', 'name', 'target'],
        img: ['src', 'srcset'],
        iframe: ['src'],
      },
    }),
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
