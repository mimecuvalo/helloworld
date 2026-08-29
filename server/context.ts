import type { Session } from '@auth/core/types';
import type { PrismaClient, User } from '../generated/prisma/client';
import { getSession } from './auth';
import prisma from './prisma';
import createLoaders, { type Loaders } from './loaders';
import { DEV_LOGIN_EMAIL } from './config';
import { CURRENT_USER_SELECT, type CurrentUser } from './user-secrets';

// Request-scoped context shared by services. Ported from data/context.ts.
export type Context = {
  currentUsername: string;
  currentUserEmail: string;
  currentUserPicture: string;
  // Identity plus the few chrome columns a request actually reads — see
  // CURRENT_USER_SELECT in user-secrets.ts.
  currentUser: CurrentUser | null;
  // The whole row, keys included, for the few paths that sign with them or want
  // a column the select above leaves out. Reads once per request, and again
  // only if currentUser is replaced by a write.
  fullUser: () => Promise<User | null>;
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
  let currentUser: CurrentUser | null = null;
  let sessionUser: Session['user'] | undefined = session?.user;
  if (session?.user?.email) {
    currentUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: CURRENT_USER_SELECT });
    currentUsername = currentUser?.username || '';
  }

  // Dev-only impersonation (skips OAuth). Never active in production builds.
  // Synthesizes a session user so authorization checks (which read ctx.user)
  // treat the request as authenticated.
  if (!currentUser && import.meta.env.DEV && DEV_LOGIN_EMAIL) {
    currentUser = await prisma.user.findUnique({ where: { email: DEV_LOGIN_EMAIL }, select: CURRENT_USER_SELECT });
    currentUsername = currentUser?.username || '';
    if (currentUser) {
      sessionUser = { email: currentUser.email, name: currentUser.name, image: currentUser.favicon || '' };
    }
  }

  // Multi-tenant host: the x-hw-host header (if proxied) else the request Host.
  const hostname = request.headers.get('x-hw-host') || request.headers.get('host') || '';

  // Keyed on the currentUser object rather than a plain flag: a write that
  // replaces the row (updateProfile) has to invalidate this, or a later signing
  // call in the same request would use the pre-write copy.
  let cached: { of: CurrentUser; row: Promise<User | null> } | undefined;

  const ctx: Context = {
    currentUsername,
    currentUserEmail: sessionUser?.email || '',
    currentUserPicture: sessionUser?.image || '',
    currentUser,
    fullUser: () => {
      const user = ctx.currentUser;
      if (!user) return Promise.resolve(null);
      if (cached?.of !== user) cached = { of: user, row: prisma.user.findUnique({ where: { id: user.id } }) };
      return cached.row;
    },
    user: sessionUser,
    prisma,
    hostname,
    loaders: createLoaders(),
    request,
  };

  return ctx;
}
