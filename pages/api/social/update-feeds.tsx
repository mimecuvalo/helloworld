import type { NextApiRequest, NextApiResponse } from 'next';
import { getRemoteAllUsers, removeOldRemoteContent } from 'social-butterfly/db';
import { parseFeedAndInsertIntoDb, retrieveFeed } from 'social-butterfly/feeds';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST' && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`) {
    await pruneOlderContent();
    await getFreshContent();

    return res.status(200).json({ success: true });
  }

  res.status(400).json({ msg: 'i call shenanigans.' });
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
    } catch {
      continue;
    }

    await parseFeedAndInsertIntoDb(userRemote, feedResponseText);
  }
}
