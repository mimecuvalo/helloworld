import { NextRequest, NextResponse } from 'next/server';
import { getRemoteAllUsers, removeOldRemoteContent } from 'social-butterfly/db';
import { parseFeedAndInsertIntoDb, retrieveFeed } from 'social-butterfly/feeds';

export default async function updateFeeds(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    await pruneOlderContent();
    await getFreshContent();

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ msg: 'i call shenanigans.' }, { status: 400 });
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
