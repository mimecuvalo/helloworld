export function buildContentSecurityPolicy(options: {
  isDevelopment: boolean;
  nonce?: string;
  s3BucketName?: string;
  scriptHashes?: string[];
}): string {
  const { isDevelopment, nonce, s3BucketName, scriptHashes } = options;
  const scripts = [
    "'self'",
    ...(isDevelopment
      ? // A hash (or nonce) makes browsers ignore 'unsafe-inline', so dev never
        // gets scriptHashes — inline content scripts already run here.
        ["'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com']
      : [
          ...(nonce ? [`'nonce-${nonce}'`, "'strict-dynamic'"] : []),
          ...(nonce && scriptHashes?.length ? scriptHashes : []),
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com',
          'https://cdn.vercel-insights.com',
          'https://va.vercel-scripts.com',
        ]),
  ];
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'connect-src': isDevelopment
      ? ['*', 'ws:', 'wss:']
      : [
          "'self'",
          'https://vitals.vercel-insights.com',
          'https://www.google-analytics.com',
          'https://*.amazonaws.com',
          ...(s3BucketName ? [`https://${s3BucketName}`] : []),
        ],
    'font-src': ["'self'", 'https:', 'data:'],
    'frame-src': ["'self'", 'http:', 'https:'],
    'img-src': ["'self'", 'data:', 'blob:', 'http:', 'https:'],
    'manifest-src': ["'self'"],
    'media-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'script-src': scripts,
    'style-src': ["'self'", 'https:', "'unsafe-inline'"],
  };
  if (!isDevelopment) directives['upgrade-insecure-requests'] = [];

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`.trim())
    .join('; ');
}
