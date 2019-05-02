import { buildUrl } from '../../../shared/util/url_factory';
import constants from '../../../shared/constants';
import { discoverUserRemoteInfoSaveAndSubscribe } from './discover_user';
import express from 'express';
import FollowConfirm from './follow_confirm';
import { parseFeedAndInsertIntoDb, retrieveFeed } from '../../util/feeds';
import pubSubHubSubscriber from './push';
import React from 'react';
import { renderToString } from 'react-dom/server';

const router = express.Router();
router.get('/', async (req, res) => {
  const { url } = req.query;

  res.send(`<!doctype html>` + renderToString(<FollowConfirm req={req} url={url} />));
});

router.post('/', async (req, res) => {
  await followUser(req, req.session.user, req.query.url);
  res.redirect('/dashboard');
});

router.use('/pubsubhubbub', pubSubHubSubscriber.listener());

export default router;

export async function followUser(req, currentUser, profileUrl) {
  try {
    const userRemote = await discoverUserRemoteInfoSaveAndSubscribe(req, profileUrl, currentUser.model.username);
    const feedResponseText = await retrieveFeed(userRemote.feed_url);
    await parseFeedAndInsertIntoDb(userRemote, feedResponseText);
    return userRemote;
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}

export async function unfollowUser(req, currentUser, hub_url, profileUrl) {
  try {
    const userRemoteParams = { local_username: currentUser.model.username, profile_url: profileUrl };
    const callbackUrl = buildUrl({ req, pathname: '/pubsubhubbub', searchParams: userRemoteParams });
    await pubSubHubSubscriber.unsubscribe(hub_url, constants.pushHub, callbackUrl);
  } catch (ex) {
    throw ex;
  }
}
