import { NextResponse } from 'next/server';
import authenticate from '@/application/authentication';

export const GET = authenticate(async () => {
  try {
    // TODO: Implement actual exception retrieval from logs/Sentry/etc.

    return NextResponse.json({
      clientExceptions: {},
      serverExceptions: {},
    });
  } catch (error) {
    console.error('List exceptions error:', error);
    return NextResponse.json({ error: 'Failed to get exceptions' }, { status: 500 });
  }
}, true /* isSuperuser */);
