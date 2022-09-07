import { parseFeedAndInsertIntoDb, retrieveFeed } from './util/feeds';

import WinstonDailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import winston from 'winston';

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

export default async function updateFeeds(options) {
  await pruneOlderContent(options);
  await getFreshContent(options);
}

async function pruneOlderContent(options) {
  try {
    const rowsDeletedCount = await options.removeOldRemoteContent();
    updateFeedsLogger.info(`pruned ${rowsDeletedCount} entries.`);
  } catch (ex) {
    updateFeedsLogger.error(`pruning db error.\n${ex}`);
  }
}

async function getFreshContent(options) {
  let usersRemote;
  try {
    usersRemote = await options.getRemoteAllUsers();
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

    await parseFeedAndInsertIntoDb(options, userRemote, feedResponseText, updateFeedsLogger);
  }
}
