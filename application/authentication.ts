import { NextApiRequest, NextApiResponse } from 'next';

import { User } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../util/auth';
import prisma from 'data/prisma';

const authenticate =
  (handler: (req: NextApiRequest, res: NextApiResponse, currentUser: User) => void) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user || !session.user.email) {
      return res.status(401).send({ msg: 'Not logged in.' });
    }

    const user = await prisma.user.findUnique({
      select: {
        email: true,
        username: true,
      },
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return res.status(403).send({ msg: 'I call shenanigans.' });
    }

    return handler(req, res, user as User);
  };

export default authenticate;
