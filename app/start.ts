import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import crypto from 'node:crypto';
import { buildContentSecurityPolicy } from 'lib/security';
import { S3_AWS_S3_BUCKET_NAME } from 'server/config';

const securityHeadersMiddleware = createMiddleware().server(({ next }) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  setResponseHeader('strict-transport-security', 'max-age=63072000; includeSubDomains; preload');
  setResponseHeader('x-content-type-options', 'nosniff');
  setResponseHeader('referrer-policy', 'no-referrer-when-downgrade');
  setResponseHeader(
    'content-security-policy',
    buildContentSecurityPolicy({
      isDevelopment: import.meta.env.DEV,
      nonce,
      s3BucketName: S3_AWS_S3_BUCKET_NAME,
    })
  );
  return next({ context: { nonce } });
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
});

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware, csrfMiddleware],
}));
