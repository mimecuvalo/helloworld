export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    const { init } = await import('@sentry/nextjs');

    const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

    init({
      dsn: SENTRY_DSN || 'https://0aaab4b2111f48b089ef20fe63544312@o324782.ingest.sentry.io/1828398',
      // Adjust this value in production, or use tracesSampler for greater control
      //tracesSampleRate: 1.0,
      // ...
      // Note: if you want to override the automatic release value, do not set a
      // `release` value here - use the environment variable `SENTRY_RELEASE`, so
      // that it will also get attached to your source maps
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    const { init } = await import('@sentry/nextjs');

    const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

    init({
      dsn: SENTRY_DSN || 'https://0aaab4b2111f48b089ef20fe63544312@o324782.ingest.sentry.io/1828398',
      // Adjust this value in production, or use tracesSampler for greater control
      //tracesSampleRate: 1.0,
      // ...
      // Note: if you want to override the automatic release value, do not set a
      // `release` value here - use the environment variable `SENTRY_RELEASE`, so
      // that it will also get attached to your source maps
    });
  }
}

export async function onRequestError(err: unknown) {
  const { captureException } = await import('@sentry/nextjs');
  return captureException(err);
}
