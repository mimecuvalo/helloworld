import Comments from './comments';
import express from 'express';
import Feed from './feed';
import FOAF from './foaf';
import Follow from './follow';
import HostMeta from './host_meta';
import OEmbed from './oembed';
import Salmon from './salmon';
import WebFinger from './webfinger';
import WebMention from './webmention';

export default function api(options) {
  const { app } = options;
  app.use('/.well-known/host-meta', HostMeta);

  const subRouter = express.Router();
  subRouter.get('/comments', Comments(options));
  subRouter.get('/feed', Feed(options));
  subRouter.get('/foaf', FOAF(options));
  subRouter.use('/follow', Follow(options));
  subRouter.get('/oembed', OEmbed(options));
  subRouter.post('/salmon', Salmon(options));
  subRouter.get('/webfinger', WebFinger(options));
  subRouter.post('/webmention', WebMention(options));

  const apiRouter = express.Router();
  apiRouter.use('/api/social', subRouter);

  app.use(apiRouter);
}