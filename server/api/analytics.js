import WinstonDailyRotateFile from 'winston-daily-rotate-file';
import express from 'express';
import path from 'path';
import winston from 'winston';

const analyticsLogger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new WinstonDailyRotateFile({
      name: 'analytics',
      filename: path.resolve(process.cwd(), 'logs', 'analytics-%DATE%.log'),
      zippedArchive: true,
    }),
  ],
});

const router = express.Router();
router.post('/', (req, res) => {
  analyticsLogger.error({ eventName: req.body.eventName, data: req.body.data });
  res.sendStatus(204);
});

export default router;
