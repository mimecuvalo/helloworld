import type { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@auth0/nextjs-auth0';
import prisma from 'data/prisma';

const authServerSideProps =
  (props: any = {}) =>
  async ({ req, res }: { req: NextApiRequest; res: NextApiResponse }) => {
    const session = getSession(req, res);

    if (!session) {
      return {
        redirect: {
          permanent: false,
          destination: '/api/auth/login',
        },
        props: {},
      };
    }

    const user = await prisma.user.findUnique({
      select: {
        email: true,
        role: true,
      },
      where: {
        email: session.user.email,
      },
    });

    if (user?.role !== 'ADMIN') {
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
