import express from 'express';
import path from 'path';
import winston from 'winston';
import WinstonDailyRotateFile from 'winston-daily-rotate-file';

/**
 * Exception collector that collects information both from window.error handler (for page load exceptions via GET)
 * and from programmatic exceptions once the app is loaded (via POST).
 * This is why there is both a GET and POST handler below.
 */

const clientsideErrorsLogger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new WinstonDailyRotateFile({
      name: 'clientside-errors',
      filename: path.resolve(process.cwd(), 'logs', 'clientside-errors-%DATE%.log'),
      zippedArchive: true,
    }),
  ],
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
