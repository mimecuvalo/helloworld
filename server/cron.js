import schedule from 'node-schedule';
import * as Sentry from '@sentry/node';

function reportingErrors(handler) {
  return async () => {
    try {
      await handler();
    } catch (error) {
      console.error(error);
      Sentry.withScope((scope) => {
        Sentry.captureException(`CronError: ${error.message}`);
      });
    }
  };
}

const cronConfig = [
  //['example', '0 * * * *', exampleFunction], // every hour
];

let scheduledJobs = [];

export function startup() {
  shutdown();

  cronConfig.forEach((config) => {
    scheduledJobs.push(schedule.scheduleJob(config[0], config[1], reportingErrors(config[2])));
  });
}

export function shutdown() {
  scheduledJobs.forEach((job) => job.cancel());
  scheduledJobs = [];
}
