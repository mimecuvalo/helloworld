import { User, UserRemote } from '@prisma/client';
import { discoverUserRemoteInfoSaveAndSubscribe } from './discover-user';
import { parseFeedAndInsertIntoDb, retrieveFeed } from './feeds';
import { NextRequest } from 'next/server';
import { follow as activityStreamsFollow } from './activitystreams';

// `req` might be null if we're doing initial setup of the server.
export async function follow(req: NextRequest, currentUser: User, profileUrl: string) {
  let userRemote;
  try {
    userRemote = await discoverUserRemoteInfoSaveAndSubscribe(req, profileUrl, currentUser.username);
    if (userRemote) {
      const feedResponseText = await retrieveFeed(userRemote.feedUrl);
      await parseFeedAndInsertIntoDb(userRemote, feedResponseText);
    }
  } catch (ex) {
    console.error(ex);
  }

  if (req && userRemote) {
    activityStreamsFollow(req, currentUser, userRemote, true /* isFollow */);
  }

  return userRemote;
}

export async function unfollow(
  req: NextRequest,
  currentUser: User,
  userRemote: UserRemote,
  // eslint-disable-next-line
  hubUrl: string | null,
  // eslint-disable-next-line
  profileUrl: string
) {
  // TODO(mime): websub / pubsubhubbub doesn't work on next.js - figure something else
  // try {
  //   const userRemoteParams = { localUsername: currentUser.username, remoteProfileUrl: profileUrl };
  //   const callbackUrl = buildUrl({ req, pathname: '/websub', searchParams: userRemoteParams });
  //   await webSubSubscriberServer.unsubscribe(hubUrl, WEB_SUB_HUB, callbackUrl);
  // } catch (ex) {
  //   console.error(ex);
  // }

  activityStreamsFollow(req, currentUser, userRemote, false /* isFollow */);
}
