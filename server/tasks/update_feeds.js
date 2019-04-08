import { mapFeedEntriesToModelEntries, FEED_MAX_DAYS_OLD, parseFeed, retrieveFeed } from '../util/feeds';
import models from '../data/models';
import path from 'path';
import Sequelize from 'sequelize';
import winston from 'winston';
import WinstonDailyRotateFile from 'winston-daily-rotate-file';

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
      where: {
        type: 'post',
        favorited: false,
        local_content_name: '',
        createdAt: { [Sequelize.Op.lt]: Date.now() - FEED_MAX_DAYS_OLD },
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
      attributes: ['id', 'feed_url', 'local_username', 'profile_url', 'username'],
    });
  } catch (ex) {
    updateFeedsLogger.error(`FAILED to get remote users from db.\n${ex}`);
    return;
  }

  for (const userRemote of usersRemote) {
    let feedResponseText;
    try {
      feedResponseText = await retrieveFeed(userRemote.feed_url);
      updateFeedsLogger.info(`${userRemote.local_username} - ${userRemote.profile_url}: fetched feed.`);
    } catch (ex) {
      updateFeedsLogger.error(`${userRemote.local_username} - ${userRemote.profile_url}: fetch FAILED.\n${ex}`);
      continue;
    }

    let newEntries, skippedCount;
    try {
      const { feedEntries } = await parseFeed(feedResponseText);
      [newEntries, skippedCount] = await mapFeedEntriesToModelEntries(feedEntries, userRemote);
      updateFeedsLogger.info(
        `${userRemote.local_username} - ${userRemote.profile_url}: ` +
          `parsed ${newEntries.length} entries, skipped ${skippedCount}.`
      );
    } catch (ex) {
      updateFeedsLogger.error(`${userRemote.local_username} - ${userRemote.profile_url}: parseFeed FAILED.\n${ex}`);
      continue;
    }

    try {
      newEntries.length &&
        (await models.Content_Remote.bulkCreate(newEntries, { ignoreDuplicates: true, validate: true }));
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
