import * as Sentry from '@sentry/tanstackstart-react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    enableLogs: true,
  });
}
