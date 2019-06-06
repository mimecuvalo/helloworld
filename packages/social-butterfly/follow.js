import { buildUrl } from './util/url_factory';
import { discoverUserRemoteInfoSaveAndSubscribe } from './discover_user';
import express from 'express';
import { follow as salmonFollow } from './salmon';
import FollowConfirm from './follow_confirm';
import { parseFeedAndInsertIntoDb, retrieveFeed } from './util/feeds';
import React from 'react';
import { renderToString } from 'react-dom/server';

const followFactory = (options) => {
  const followRouter = express.Router();
  followRouter.get('/', async (req, res) => {
    const { url } = req.query;

    res.send(`<!doctype html>` + renderToString(<FollowConfirm req={req} url={url} />));
  });

  followRouter.post('/', async (req, res) => {
    await follow(req, req.session.user, req.query.url);
    res.redirect('/');
  });

  followRouter.use('/pubsubhubbub', options.pushSubscriberServer.listener());

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

    try {
      req && salmonFollow(req, currentUser.model, userRemote.salmon_url, true /* isFollow */);
    } catch (ex) {
      console.error(ex);
    }

    return userRemote;
  }

  async function unfollow(req, currentUser, userRemote, hub_url, profileUrl) {
    try {
      const userRemoteParams = { localUsername: currentUser.model.username, remoteProfileUrl: profileUrl };
      const callbackUrl = buildUrl({ req, pathname: '/pubsubhubbub', searchParams: userRemoteParams });
      await options.pushSubscriberServer.unsubscribe(hub_url, options.constants.pushHub, callbackUrl);
    } catch (ex) {
      console.error(ex);
    }

    try {
      salmonFollow(req, currentUser.model, userRemote.salmon_url, false /* isFollow */);
    } catch (ex) {
      console.error(ex);
    }
  }

  return { followRouter, follow, unfollow };
}

export default followFactory;