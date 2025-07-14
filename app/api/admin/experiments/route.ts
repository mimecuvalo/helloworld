import { NextResponse } from 'next/server';
import { REGISTERED_EXPERIMENTS } from '@/application/experiments';
import authenticate from '@/application/authentication';

export const GET = authenticate(async () => {
  try {
    return NextResponse.json({ experiments: REGISTERED_EXPERIMENTS });
  } catch (error) {
    console.error('Experiments error:', error);
    return NextResponse.json({ error: 'Failed to get experiments' }, { status: 500 });
  }
}, true /* isSuperuser */);
