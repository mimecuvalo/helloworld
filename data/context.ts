import auth0 from 'vendor/auth0';
import { NextRequest } from 'next/server';

import { PrismaClient, User } from '@prisma/client';
import DataLoader from 'dataloader';
import createLoaders from './loaders';
import prisma from './prisma';

export type Context = {
  currentUsername: string;
  currentUserEmail: string;
  currentUserPicture: string;
  currentUser: User | null;
  user?: any; // Use any for now - can be refined later when we know the exact type
  accessToken?: string;
  prisma: PrismaClient;
  hostname: string;
  loaders: { [key: string]: DataLoader<unknown, unknown> };
  req: NextRequest;
};

export async function createContext(req: NextRequest): Promise<Context> {
  let session;

  try {
    session = await auth0.getSession();
  } catch {
    // fall through
  }

  let currentUsername = '';
  let currentUser = null;
  let currentUserEmail = '';
  let currentUserPicture = '';
  let hostname = '';

  if (session?.user) {
    currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    currentUsername = currentUser?.username || '';
    currentUserEmail = session.user.email || '';
    currentUserPicture = session.user.picture || '';
  }

  if (req) {
    hostname = req.headers.get('host') || req.nextUrl.host || '';
  }

  return {
    currentUsername,
    currentUserEmail,
    currentUserPicture,
    user: session?.user,
    accessToken: undefined, // Access token handling would need to be implemented separately if needed
    prisma,
    hostname,
    currentUser,
    loaders: createLoaders(),
    req,
  };
}
