import _ from 'lodash';
import express from 'express';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { REGISTERED_EXPERIMENTS } from 'server/app/experiments';

const router = express.Router();
router.post('/repl', async (req, res) => {
  // Also, this is disabled by default because it's so powerful (a powerful footgun, that is).
  // Enabling this means you need to make damn sure the API you're calling is internally accessible only.
  return res.json({ result: 'DISABLED_FOR_SECURITY_DONT_ENABLE_UNLESS_YOU_KNOW_WHAT_YOURE_DOING', success: false });

  // const source = req.body.source;
  // let success = true;
  // let result = null;
  // try {
  //   result = eval(source);
  // } catch (ex) {
  //   success = false;
  //   console.log(ex);
  // }
  // res.json({ result, success });
});

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100,
});

router.get('/list-exceptions', apiLimiter, async (req, res) => {
  let clientExceptionsRaw = '',
    serverExceptionsRaw = '';
  try {
    clientExceptionsRaw = fs.readFileSync(
      path.resolve(process.cwd(), 'logs', `clientside-exceptions-${new Date().toISOString().slice(0, 10)}.log`),
      'utf8'
    );
    serverExceptionsRaw = fs.readFileSync(
      path.resolve(process.cwd(), 'logs', `serverside-exceptions-${new Date().toISOString().slice(0, 10)}.log`),
      'utf8'
    );
  } catch (ex) {
    // silently fail.
    console.log(ex);
  }

  const individualClientExceptions = clientExceptionsRaw
    .split('\n')
    .map((e) => e && JSON.parse(e))
    .filter((e) => e);
  const clientExceptions = _.groupBy(individualClientExceptions, 'message');
  const individualServerExceptions = serverExceptionsRaw
    .split('\n')
    .map((e) => e && JSON.parse(e))
    .filter((e) => e);
  const serverExceptions = _.groupBy(individualServerExceptions, 'message');

  res.json({ clientExceptions, serverExceptions });
});

router.get('/experiments', async (req, res) => {
  res.json({ experiments: REGISTERED_EXPERIMENTS });
});

export default router;
