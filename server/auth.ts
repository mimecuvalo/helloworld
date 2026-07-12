import { Auth, type AuthConfig } from '@auth/core';
import Google from '@auth/core/providers/google';
import type { Session } from '@auth/core/types';
import { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET } from './config';

export const authConfig: AuthConfig = {
  secret: AUTH_SECRET,
  basePath: '/api/auth',
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: AUTH_GOOGLE_ID,
      clientSecret: AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
};

export function authHandler(request: Request): Promise<Response> {
  return Auth(request, authConfig);
}

export async function getSession(request: Request): Promise<Session | null> {
  const url = new URL('/api/auth/session', request.url);
  const response = await Auth(new Request(url, { headers: request.headers }), authConfig);

  if (!response.ok) return null;

  const session = (await response.json()) as Session | Record<string, never>;
  if (!session || Object.keys(session).length === 0) return null;

  return session as Session;
}
