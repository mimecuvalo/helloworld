import type { NextApiRequest, NextApiResponse } from 'next';
import { User, UserRemote } from '@prisma/client';
import { parseFeedAndInsertIntoDb, retrieveFeed } from 'social-butterfly/feeds';

import { follow as activityStreamsFollow } from 'social-butterfly/activitystreams';
import { buildUrl } from 'util/url-factory';
import { discoverUserRemoteInfoSaveAndSubscribe } from 'social-butterfly/discover-user';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from 'data/prisma';
import { renderToString } from 'react-dom/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = getSession(req, res);
  let currentUser;
  if (session) {
    currentUser = await prisma.user.findUnique({ where: { email: session?.user.email } });
  }
  if (!currentUser) {
    res.status(400).end();
    return;
  }

  if (req.method === 'GET') {
    res.send(`<!doctype html>` + renderToString(<FollowConfirm req={req} resource={req.query.resource as string} />));
  } else {
    await follow(req, currentUser, req.query.resource as string);
    res.redirect('/');
  }
}

// `req` might be null if we're doing initial setup of the server.
export async function follow(req: NextApiRequest, currentUser: User, profileUrl: string) {
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

  req && userRemote && activityStreamsFollow(req, currentUser, userRemote, true /* isFollow */);

  return userRemote;
}

export async function unfollow(
  req: NextApiRequest,
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

function FollowConfirm({ req, resource }: { req: NextApiRequest; resource: string }) {
  const actionUrl = buildUrl({ pathname: '/api/social/follow', searchParams: { resource } });

  // TODO(mime): good candidate to make a `SimpleHTMLBase` template.
  // TODO(mime): add i18n
  return (
    <html lang="en">
      {/* eslint-disable-next-line */}
      <head>
        <meta charSet="utf-8" />
        <title>Confirm follow request</title>
      </head>
      {/* eslint-disable-next-line */}
      <link rel="stylesheet" href="/css/themes/pixel.css" />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
              'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
              'Droid Sans', 'Helvetica Neue', sans-serif;
            font-size: 13px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }

          button {
            font-size: 24px;
            float: none;
            outline: 0 !important;
          }
        `,
        }}
      />

      <body>
        <h1>{`Confirm Follow: ${req.url}`}</h1>
        <form action={actionUrl} method="post">
          <button type="submit">Follow</button>
        </form>
      </body>
    </html>
  );
}
