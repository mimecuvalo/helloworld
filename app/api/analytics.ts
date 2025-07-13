import { NextRequest, NextResponse } from 'next/server';

export default async function analytics(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();

    // Hook up a analytics service here on the backend if desired. (e.g. Amplitude)
    console.debug('Analytics:', { eventName: body.eventName, data: body.data });

    return NextResponse.json(null, { status: 204 });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
