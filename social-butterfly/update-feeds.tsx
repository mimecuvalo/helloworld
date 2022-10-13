import { parseFeedAndInsertIntoDb, retrieveFeed } from './feeds';

export default async function updateFeeds(options) {
  await pruneOlderContent(options);
  await getFreshContent(options);
}

async function pruneOlderContent(options) {
  await options.removeOldRemoteContent();
}

async function getFreshContent(options) {
  const usersRemote = await options.getRemoteAllUsers();

  for (const userRemote of usersRemote) {
    let feedResponseText;
    try {
      feedResponseText = await retrieveFeed(userRemote.feed_url);
    } catch (ex) {
      continue;
    }

    await parseFeedAndInsertIntoDb(options, userRemote, feedResponseText);
  }
}
