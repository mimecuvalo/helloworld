function readEnv(key: string): string | undefined {
  const metaEnv = import.meta.env as unknown as Record<string, string | undefined>;
  return metaEnv[key] ?? process.env[key];
}

export const AUTH_SECRET = readEnv('AUTH_SECRET') ?? readEnv('NEXTAUTH_SECRET');
export const AUTH_GOOGLE_ID = readEnv('AUTH_GOOGLE_ID');
export const AUTH_GOOGLE_SECRET = readEnv('AUTH_GOOGLE_SECRET');
export const NODE_ENV = readEnv('NODE_ENV') ?? 'development';

// Dev-only: impersonate this user's email (skips Google OAuth) so owner/write
// paths can be exercised locally. Ignored unless import.meta.env.DEV.
export const DEV_LOGIN_EMAIL = readEnv('DEV_LOGIN_EMAIL');
export const DATABASE_URL = readEnv('DATABASE_URL') ?? '';

// Cron auth for /api/social/update-feeds (Vercel cron sends this bearer token).
export const CRON_SECRET = readEnv('CRON_SECRET') ?? '';
// 32-byte key encrypting the secrets on the User row (see server/secrets.ts).
// Generate with: openssl rand -hex 32
export const SECRETS_KEY = readEnv('SECRETS_KEY') ?? '';
// Optional: a Bluesky app password supplied by the environment instead of the
// dashboard. For a single-tenant blog this is the better home for it — the
// credential never reaches the database at all.
export const BLUESKY_APP_PASSWORD = readEnv('BLUESKY_APP_PASSWORD') ?? '';

// S3 (uploads + resource URLs).
export const S3_AWS_REGION = readEnv('S3_AWS_REGION') ?? '';
export const S3_AWS_ACCESS_KEY = readEnv('S3_AWS_ACCESS_KEY') ?? '';
export const S3_AWS_SECRET_KEY = readEnv('S3_AWS_SECRET_KEY') ?? '';
export const S3_AWS_S3_BUCKET_NAME = readEnv('S3_AWS_S3_BUCKET_NAME') ?? '';
