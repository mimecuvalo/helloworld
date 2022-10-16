import ActivityPub from './activitypub';
import Comments from './comments';
import FOAF from './foaf';
import Feed from './feed';
import Follow from './follow';
import HostMeta from './host-meta';
import OEmbed from './oembed';
import Salmon from './salmon';
import WebFinger from './webfinger';
import WebMention from './webmention';
import WebSub from './websub';
import { like } from './activitystreams';
import schedule from 'node-schedule';
import syndicate from './syndicate';
import updateFeeds from './update-feeds';

export default (options?: any) => {
  options.webSubSubscriberServer = WebSub(options);

  const { apiRouter, follow, unfollow } = setupApi(options);
  setupTasks(options);
  const syndicateWithOptions = syndicate(options);

  const dispose = () => {
    schedule.cancelJob('updateFeeds');
  };

  return { apiRouter, dispose, follow, like, syndicate: syndicateWithOptions, unfollow };
};

function setupApi(options?: any) {
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

function setupTasks(options?: any) {
  // Updates at 1am every night.
  schedule.scheduleJob('updateFeeds', '0 1 * * *', () => updateFeeds(options));
}
