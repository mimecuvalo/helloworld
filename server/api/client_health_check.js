import express from 'express';

/**
 * The app will periodically send up a signal to see if it's a valid client.
 * The client will provide information like its git commit hash id at time of release and time of release.
 * Based on this information, you can selectively disable clients that might be potentially harmful in the wild
 * either because of issues like DDOSing or data-loss-causing clients.
 *
 * Meant to be a path of last resort! It's jarring for a client to reset so only do this if as a stop-the-presses
 * option.
 */

const router = express.Router();
router.post('/', (req, res) => {
  if (req.body.appVersion === 'somebadid' || req.body.appTime < 0 /* or before some time you specify as bad */) {
    res.send('bad');
    return;
  }

  // Otherwise, the client is good.
  res.send('ok');
});

export default router;
