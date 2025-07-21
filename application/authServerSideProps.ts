import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerSession } from 'next-auth';
import { authOptions } from '../util/auth';
import prisma from 'data/prisma';

const authServerSideProps =
  (props: any = {}) =>
  async ({ req, res }: { req: NextApiRequest; res: NextApiResponse }) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user || !session.user.email) {
      return {
        redirect: {
          permanent: false,
          destination: '/api/auth/signin',
        },
        props: {},
      };
    }

    const user = await prisma.user.findUnique({
      select: {
        email: true,
        superuser: true,
      },
      where: {
        email: session.user.email,
      },
    });

    if (!user?.superuser) {
      return {
        redirect: {
          permanent: false,
          destination: '/404',
        },
        props: {},
      };
    }

    return {
      props,
    };
  };

export default authServerSideProps;
