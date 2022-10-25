import { NextApiRequest, NextApiResponse } from 'next';

import { User } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const authenticate =
  (handler: (req: NextApiRequest, res: NextApiResponse, currentUser: User) => void) =>
  async (req: NextApiRequest, res: NextApiResponse) => {
    const session = getSession(req, res);

    if (!session) {
      return res.status(401).send({ msg: 'Not logged in.' });
    }

    const user = await prisma?.user.findUnique({
      select: {
        email: true,
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
