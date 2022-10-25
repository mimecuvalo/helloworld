import { Claims, getSession } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, User } from '@prisma/client';

import DataLoader from 'dataloader';
import createLoaders from './loaders';
import prisma from './prisma';

export type Context = {
  currentUsername: string;
  currentUserEmail: string;
  currentUserPicture: string;
  currentUser: User | null;
  user?: Claims;
  accessToken?: string;
  prisma: PrismaClient;
  hostname: string;
  loaders: { [key: string]: DataLoader<unknown, unknown> };
  req: NextApiRequest;
};

export async function createContext({ req, res }: { req: NextApiRequest; res: NextApiResponse }): Promise<Context> {
  const session = getSession(req, res);

  let currentUsername = '';
  let currentUser = null;
  if (session) {
    currentUser = await prisma.user.findUnique({ where: { email: session?.user.email } });
    currentUsername = currentUser?.username || '';
  }

  return {
    currentUsername,
    currentUserEmail: session?.user.email,
    currentUserPicture: session?.user.picture,
    user: session?.user,
    accessToken: session?.accessToken,
    prisma,
    hostname: req.headers['host'] || '',
    req,
    currentUser,
    loaders: createLoaders(),
  };
}
