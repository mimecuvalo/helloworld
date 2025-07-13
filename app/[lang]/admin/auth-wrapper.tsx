import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import auth0 from 'vendor/auth0';
import prisma from 'data/prisma';

export default async function AuthWrapper({ children }: { children: ReactNode }) {
  try {
    const session = await auth0.getSession();

    if (!session?.user) {
      redirect('/auth/login');
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
      redirect('/not-found');
    }

    return <>{children}</>;
  } catch (error) {
    console.error('Auth wrapper error:', error);
    redirect('/auth/login');
  }
}
