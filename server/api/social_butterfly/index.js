import express from 'express';
import FOAF from './foaf';
import RSS from './rss';
import WebFinger from './webfinger';

const router = express.Router();
router.get('/foaf', FOAF);
router.get('/rss', RSS);
router.get('/webfinger', WebFinger);

export default router;
