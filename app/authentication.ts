import { NextApiRequest, NextApiResponse } from 'next';

import { User } from '@prisma/client';
import auth0 from 'vendor/auth0';
import prisma from 'data/prisma';

const authenticate =
  (handler: (req: NextApiRequest, res: NextApiResponse, currentUser: User) => void) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await auth0.getSession(req, res);

    if (!session) {
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
