import { NextRequest, NextResponse } from 'next/server';

export default async function reportError(request: NextRequest) {
  if (request.method === 'POST') {
    const body = await request.json();

    // Hook up a error logging service here on the backend if desired (e.g. Sentry).
    console.debug('Error:', body.data);

    return new NextResponse(null, { status: 204 });
  } else if (request.method === 'GET') {
    const url = new URL(request.url);
    const data = url.searchParams.get('data');

    // Hook up a error logging service here on the backend if desired (e.g. Sentry).
    console.debug('Error:', data ? JSON.parse(data) : 'No data');
  } else {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
}
