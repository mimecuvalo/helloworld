import express from 'express';
import RSS from './rss';

const router = express.Router();
router.get('/rss', RSS);

export default router;
