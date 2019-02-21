import authRouter from './auth';
import clientHealthCheckRouter from './client_health_check';
import errorRouter from './error';
import express from 'express';
import openSearchRouterFactory from './opensearch';
import socialButterfly from './social-butterfly';
import upload from './upload';

/**
 * Main routing entry point for all of our API server.
 */
export default function apiServerFactory({ appName }) {
  const router = express.Router();
  router.use('/auth', authRouter);
  router.use('/client-health-check', clientHealthCheckRouter);
  router.use('/is-user-logged-in', checkIsLoggedIn, (req, res) => {
    // Just an example of the checkIsLoggedIn (very simplistic) capability.
    res.send('OK');
  });
  router.use('/opensearch', openSearchRouterFactory({ appName }));
  router.use('/report-error', errorRouter);
  router.use('/social', socialButterfly);
  router.use('/upload', upload);
  router.get('/', (req, res) => {
    res.sendStatus(404);
  });

  return router;
}

const checkIsLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    res.send(401);
  }

  next();
};
