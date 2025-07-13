import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Initialize the Auth0 client using v4 SDK
const client = new Auth0Client({
  domain: process.env.AUTH0_ISSUER_BASE_URL || process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID || process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL,
  secret: process.env.AUTH0_SECRET,

  authorizationParameters: {
    // In v4, the AUTH0_SCOPE and AUTH0_AUDIENCE environment variables for API authorized applications are no longer automatically picked up by the SDK.
    // Instead, we need to provide the values explicitly.
    scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access',
    audience: process.env.AUTH0_AUDIENCE,
  },

  session: {
    absoluteDuration: parseInt(process.env.AUTH0_SESSION_COOKIE_LIFETIME ?? '31536000'),
  },
});

export default client;
