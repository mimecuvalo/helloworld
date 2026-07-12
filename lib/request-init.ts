import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader, setResponseHeader } from '@tanstack/react-start/server';
import { S3_AWS_S3_BUCKET_NAME } from 'server/config';

export const SUPPORTED_LOCALES = ['en', 'fr', 'xx-LS'] as const;
export const DEFAULT_LOCALE = 'en';

function generateCsp(isDev: boolean): string {
  const s3 = S3_AWS_S3_BUCKET_NAME;
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'connect-src': isDev
      ? ['*', 'ws:', 'wss:']
      : [
          "'self'",
          'https://*.ingest.sentry.io',
          'https://vitals.vercel-insights.com',
          'https://www.google-analytics.com',
          'https://*.amazonaws.com',
          ...(s3 ? [`https://${s3}`] : []),
        ],
    'font-src': ["'self'", 'https:', 'data:'],
    // http/https frames cover YouTube (lite-youtube) embeds.
    'frame-src': ["'self'", 'http:', 'https:'],
    // blob: for editor image previews; http/https for S3 + Creative Commons + remote feed images.
    'img-src': ["'self'", 'data:', 'blob:', 'http:', 'https:'],
    'manifest-src': ["'self'"],
    'media-src': ["'self'", 'blob:'],
    'object-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"].concat(
      isDev
        ? ["'unsafe-eval'", 'https://unpkg.com']
        : [
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com',
            'https://cdn.vercel-insights.com',
            'https://va.vercel-scripts.com',
          ]
    ),
    'style-src': ["'self'", 'https:', "'unsafe-inline'"],
  };
  if (!isDev) directives['upgrade-insecure-requests'] = [];
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(' ')}`.trim())
    .join('; ');
}

function detectLocale(): string {
  const cookie = getRequestHeader('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const fromCookie = match?.[1];
  if (fromCookie && (SUPPORTED_LOCALES as readonly string[]).includes(fromCookie)) {
    return fromCookie;
  }

  const accept = getRequestHeader('accept-language') ?? '';
  if (/\bfr\b/.test(accept)) return 'fr';

  return DEFAULT_LOCALE;
}

export const initRequest = createServerFn({ method: 'GET' }).handler(() => {
  setResponseHeader('strict-transport-security', 'max-age=63072000; includeSubDomains; preload');
  setResponseHeader('x-content-type-options', 'nosniff');
  setResponseHeader('x-xss-protection', '1; mode=block');
  setResponseHeader('referrer-policy', 'no-referrer-when-downgrade');
  setResponseHeader('content-security-policy', generateCsp(import.meta.env.DEV));

  return { locale: detectLocale() };
});
