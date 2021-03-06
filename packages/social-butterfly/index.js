import ActivityPub from './activitypub';
import Comments from './comments';
import express from 'express';
import Feed from './feed';
import FOAF from './foaf';
import Follow from './follow';
import HostMeta from './host_meta';
import { like } from './activitystreams';
import OEmbed from './oembed';
import Salmon from './salmon';
import schedule from 'node-schedule';
import syndicate from './syndicate';
import updateFeeds from './update_feeds';
import WebFinger from './webfinger';
import WebMention from './webmention';
import WebSub from './websub';

export default (options) => {
  options.webSubSubscriberServer = WebSub(options);

  const { apiRouter, follow, unfollow } = setupApi(options);
  setupTasks(options);
  const syndicateWithOptions = syndicate(options);

  const dispose = () => {
    schedule.cancelJob('updateFeeds');
  };

  return { apiRouter, dispose, follow, like, syndicate: syndicateWithOptions, unfollow };
};

function setupApi(options) {
  const { app } = options;
  app.use('/.well-known/host-meta', HostMeta);
  app.get('/.well-known/webfinger', WebFinger(options));

  const { followRouter, follow, unfollow } = Follow(options);

  const subRouter = express.Router();
  subRouter.use('/activitypub', ActivityPub(options));
  subRouter.get('/comments', Comments(options));
  subRouter.get('/feed', Feed(options));
  subRouter.get('/foaf', FOAF(options));
  subRouter.use('/follow', followRouter);
  subRouter.get('/oembed', OEmbed(options));
  subRouter.post('/salmon', Salmon(options));
  subRouter.post('/webmention', WebMention(options));

  const apiRouter = express.Router();
  apiRouter.use('/api/social', subRouter);

  app.use(apiRouter);

  return { apiRouter, follow, unfollow };
}

function setupTasks(options) {
  // Updates at 1am every night.
  schedule.scheduleJob('updateFeeds', '0 1 * * *', () => updateFeeds(options));
}
