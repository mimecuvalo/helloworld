import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import auth0 from 'vendor/auth0';
import prisma from 'data/prisma';

const authenticate =
  (handler: (req: NextRequest, currentUser: User) => Promise<NextResponse>, isSuperuser: boolean = false) =>
  async (req: NextRequest) => {
    const session = await auth0.getSession();

    if (!session?.user) {
      return NextResponse.json({ msg: 'Not logged in.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      select: {
        email: true,
        username: true,
        superuser: true,
      },
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json({ msg: 'I call shenanigans.' }, { status: 403 });
    }

    if (isSuperuser && !user.superuser) {
      return NextResponse.json({ msg: 'You are not authorized to access this resource.' }, { status: 403 });
    }

    return handler(req, user as User);
  };

export default authenticate;
