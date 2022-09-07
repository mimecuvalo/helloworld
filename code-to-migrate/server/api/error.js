import WinstonDailyRotateFile from 'winston-daily-rotate-file';
import express from 'express';
import path from 'path';
import winston from 'winston';

/**
 * Exception collector that collects information both from window.error handler (for page load exceptions via GET)
 * and from programmatic exceptions once the app is loaded (via POST).
 * This is why there is both a GET and POST handler below.
 */

const clientsideErrorsLogger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new WinstonDailyRotateFile({
      name: 'clientside-exceptions',
      filename: path.resolve(process.cwd(), 'logs', 'clientside-exceptions-%DATE%.log'),
      zippedArchive: true,
    }),
  ],
});

const serversideErrorsLogger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new WinstonDailyRotateFile({
      name: 'serverside-exceptions',
      filename: path.resolve(process.cwd(), 'logs', 'serverside-exceptions-%DATE%.log'),
      zippedArchive: true,
    }),
  ],
});

process.on('unhandledRejection', (err) => {
  serversideErrorsLogger.error(err);
});

const router = express.Router();
router.get('/', (req, res) => {
  clientsideErrorsLogger.error(JSON.parse(req.query.data));
  res.sendStatus(204);
});
router.post('/', (req, res) => {
  clientsideErrorsLogger.error(req.body.data);
  res.sendStatus(204);
});

export default router;
