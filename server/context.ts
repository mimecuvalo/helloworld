import type { Session } from '@auth/core/types';
import type { PrismaClient, User } from '../generated/prisma/client';
import { getSession } from './auth';
import prisma from './prisma';
import createLoaders, { type Loaders } from './loaders';
import { DEV_LOGIN_EMAIL } from './config';

// Request-scoped context shared by services. Ported from data/context.ts.
export type Context = {
  currentUsername: string;
  currentUserEmail: string;
  currentUserPicture: string;
  currentUser: User | null;
  user?: Session['user'];
  prisma: PrismaClient;
  hostname: string;
  loaders: Loaders;
  request: Request;
};

export async function createContext(request: Request): Promise<Context> {
  let session: Session | null = null;
  try {
    session = await getSession(request);
  } catch {
    // unauthenticated
  }

  let currentUsername = '';
  let currentUser: User | null = null;
  let sessionUser: Session['user'] | undefined = session?.user;
  if (session?.user?.email) {
    currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    currentUsername = currentUser?.username || '';
  }

  // Dev-only impersonation (skips OAuth). Never active in production builds.
  // Synthesizes a session user so authorization checks (which read ctx.user)
  // treat the request as authenticated.
  if (!currentUser && import.meta.env.DEV && DEV_LOGIN_EMAIL) {
    currentUser = await prisma.user.findUnique({ where: { email: DEV_LOGIN_EMAIL } });
    currentUsername = currentUser?.username || '';
    if (currentUser) {
      sessionUser = { email: currentUser.email, name: currentUser.name, image: currentUser.favicon || '' };
    }
  }

  // Multi-tenant host: the x-hw-host header (if proxied) else the request Host.
  const hostname = request.headers.get('x-hw-host') || request.headers.get('host') || '';

  return {
    currentUsername,
    currentUserEmail: sessionUser?.email || '',
    currentUserPicture: sessionUser?.image || '',
    currentUser,
    user: sessionUser,
    prisma,
    hostname,
    loaders: createLoaders(),
    request,
  };
}
