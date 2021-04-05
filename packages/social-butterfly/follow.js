import { buildUrl } from './util/url_factory';
import { discoverUserRemoteInfoSaveAndSubscribe } from './discover_user';
import express from 'express';
import { follow as activityStreamsFollow } from './activitystreams';
import FollowConfirm from './follow_confirm';
import { parseFeedAndInsertIntoDb, retrieveFeed } from './util/feeds';
import { renderToString } from 'react-dom/server';

export default (options) => {
  const followRouter = express.Router();
  followRouter.get('/', async (req, res) => {
    const { resource } = req.query;

    res.send(`<!doctype html>` + renderToString(<FollowConfirm req={req} resource={resource} />));
  });

  followRouter.post('/', async (req, res) => {
    await follow(req, req.session.user, req.query.resource);
    res.redirect('/');
  });

  followRouter.use('/websub', options.webSubSubscriberServer.listener());

  // `req` might be null if we're doing initial setup of the server.
  async function follow(req, currentUser, profileUrl) {
    let userRemote;
    try {
      userRemote = await discoverUserRemoteInfoSaveAndSubscribe(req, options, profileUrl, currentUser.model.username);
      const feedResponseText = await retrieveFeed(userRemote.feed_url);
      await parseFeedAndInsertIntoDb(options, userRemote, feedResponseText);
    } catch (ex) {
      console.error(ex);
    }

    req && activityStreamsFollow(req, currentUser.model, userRemote, true /* isFollow */);

    return userRemote;
  }

  async function unfollow(req, currentUser, userRemote, hub_url, profileUrl) {
    try {
      const userRemoteParams = { localUsername: currentUser.model.username, remoteProfileUrl: profileUrl };
      const callbackUrl = buildUrl({ req, pathname: '/websub', searchParams: userRemoteParams });
      await options.webSubSubscriberServer.unsubscribe(hub_url, options.constants.webSubHub, callbackUrl);
    } catch (ex) {
      console.error(ex);
    }

    activityStreamsFollow(req, currentUser.model, userRemote, false /* isFollow */);
  }

  return { followRouter, follow, unfollow };
};
