import { buildUrl } from '../../../shared/util/url_factory';
import constants from '../../../shared/constants';
import { discoverAndParseFeedFromUrl, mapFeedAndInsertIntoDb } from '../../util/feeds';
import express from 'express';
import FollowConfirm from './follow_confirm';
import models from '../../data/models';
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
  const { feedMeta, feedEntries } = await discoverAndParseFeedFromUrl(profileUrl);

  const parsedUrl = new URL(profileUrl);
  await models.User_Remote.upsert({
    local_username: currentUser.model.username,
    username: feedMeta['atom:author']?.['poco:preferredusername']['#'] || feedMeta.title || profileUrl,
    name: feedMeta.author || feedMeta['atom:author']?.['poco:displayname'] || '',
    profile_url: profileUrl,
    salmon_url:
      feedMeta['atom:link'] && [].concat(feedMeta['atom:link']).find(link => link['@'].rel === 'salmon')?.['@'].href,
    feed_url: feedMeta.xmlurl,
    hub_url: feedMeta.cloud?.type === 'hub' ? feedMeta.cloud.href : undefined,
    avatar: feedMeta.image?.url,
    favicon: feedMeta.favicon || `${parsedUrl.origin}/favicon.ico`,
    following: true,
    order: Math.pow(2, 31) - 1,
  });

  const userRemoteParams = { local_username: currentUser.model.username, profile_url: profileUrl };
  const userRemote = await models.User_Remote.findOne({
    where: userRemoteParams,
  });

  try {
    await mapFeedAndInsertIntoDb(userRemote, feedEntries);
  } catch (ex) {
    throw ex;
  }

  try {
    const callbackUrl = buildUrl({ req, pathname: '/pubsubhubbub', searchParams: userRemoteParams });
    await pubSubHubSubscriber.subscribe(profileUrl, constants.pushHub, callbackUrl);
  } catch (ex) {
    throw ex;
  }

  return userRemote;
}

export async function unfollowUser(req, currentUser, profileUrl) {
  try {
    const userRemoteParams = { local_username: currentUser.model.username, profile_url: profileUrl };
    const callbackUrl = buildUrl({ req, pathname: '/pubsubhubbub', searchParams: userRemoteParams });
    await pubSubHubSubscriber.unsubscribe(profileUrl, constants.pushHub, callbackUrl);
  } catch (ex) {
    throw ex;
  }
}
