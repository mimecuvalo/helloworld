import { getServerSession, Session } from 'next-auth';
import { authOptions } from '../util/auth';
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
  user?: Session['user'];
  accessToken?: string;
  prisma: PrismaClient;
  hostname: string;
  loaders: { [key: string]: DataLoader<unknown, unknown> };
  req: NextApiRequest;
};

export async function createContext({ req, res }: { req: NextApiRequest; res: NextApiResponse }): Promise<Context> {
  const session = await getServerSession(req, res, authOptions);

  let currentUsername = '';
  let currentUser = null;
  if (session?.user?.email) {
    currentUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    currentUsername = currentUser?.username || '';
  }

  return {
    currentUsername,
    currentUserEmail: session?.user?.email || '',
    currentUserPicture: '',
    user: session?.user,
    accessToken: undefined, // Access token handling would need to be implemented separately if needed
    prisma,
    hostname: (req.headers['x-hw-host'] as string) || '',
    req,
    currentUser,
    loaders: createLoaders(),
  };
}
