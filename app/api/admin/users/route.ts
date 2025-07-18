import { NextResponse } from 'next/server';
import prisma from 'data/prisma';
import authenticate from '@/application/authentication';

export const GET = authenticate(async () => {
  try {
    const users = await prisma?.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        description: true,
        superuser: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('Users error:', error);
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}, true /* isSuperuser */);
