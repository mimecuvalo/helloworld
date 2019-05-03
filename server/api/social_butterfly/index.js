import Comments from './comments';
import express from 'express';
import Feed from './feed';
import FOAF from './foaf';
import Follow from './follow';
import OEmbed from './oembed';
import Salmon from './salmon';
import WebFinger from './webfinger';
import WebMention from './webmention';

const router = express.Router();
router.get('/comments', Comments);
router.get('/feed', Feed);
router.get('/foaf', FOAF);
router.use('/follow', Follow);
router.get('/oembed', OEmbed);
router.post('/salmon', Salmon);
router.get('/webfinger', WebFinger);
router.post('/webmention', WebMention);

export default router;
