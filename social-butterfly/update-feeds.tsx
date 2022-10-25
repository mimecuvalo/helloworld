import { getRemoteAllUsers, removeOldRemoteContent } from './db';
import { parseFeedAndInsertIntoDb, retrieveFeed } from './feeds';

export default async function updateFeeds() {
  await pruneOlderContent();
  await getFreshContent();
}

async function pruneOlderContent() {
  await removeOldRemoteContent();
}

async function getFreshContent() {
  const usersRemote = await getRemoteAllUsers();

  for (const userRemote of usersRemote) {
    let feedResponseText;
    try {
      feedResponseText = await retrieveFeed(userRemote.feedUrl);
    } catch (ex) {
      continue;
    }

    await parseFeedAndInsertIntoDb(userRemote, feedResponseText);
  }
}
