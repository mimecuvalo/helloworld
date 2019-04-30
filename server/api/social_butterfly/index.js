import Comments from './comments';
import express from 'express';
import Feed from './feed';
import FOAF from './foaf';
import Follow from './follow';
import OEmbed from './oembed';
import WebFinger from './webfinger';

const router = express.Router();
router.get('/comments', Comments);
router.get('/feed', Feed);
router.get('/foaf', FOAF);
router.use('/follow', Follow);
router.get('/oembed', OEmbed);
router.get('/webfinger', WebFinger);

export default router;
