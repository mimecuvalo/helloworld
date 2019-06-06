import authorization from '../util/authorization';
import authRouter from './auth';
import clientHealthCheckRouter from './client_health_check';
import dataLiberation from './data_liberation';
import errorRouter from './error';
import express from 'express';
import openSearchRouterFactory from './opensearch';
import stats from './stats';
import unfurl from './unfurl';
import upload from './upload';

/**
 * Main routing entry point for all of our API server.
 */
export default function apiServerFactory({ appName }) {
  const router = express.Router();
  router.use('/auth', authRouter);
  router.use('/client-health-check', clientHealthCheckRouter);
  router.get('/data-liberation', isAuthor, dataLiberation);
  router.use('/is-user-logged-in', isAuthenticated, (req, res) => {
    // Just an example of the isAuthenticated (very simplistic) capability.
    res.send('OK');
  });
  router.use('/opensearch', openSearchRouterFactory({ appName }));
  router.use('/report-error', errorRouter);
  router.use('/stats', stats);
  router.use('/unfurl', isAuthor, unfurl);
  router.use('/upload', isAuthor, upload);
  router.get('/', (req, res) => {
    res.sendStatus(404);
  });

  return router;
}

const isAuthenticated = (req, res, next) =>
  authorization.isAuthenticated(req.session.user) ? next() : res.sendStatus(401);

const isAuthor = (req, res, next) =>
  authorization.isAuthor(req.session.user) ? next() : res.status(403).send('I call shenanigans.');

// const isAdmin = (req, res, next) =>
//   authorization.isAdmin(req.session.user) ? next() : res.status(403).send('I call shenanigans.');
