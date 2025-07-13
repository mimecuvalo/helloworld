import { NextRequest, NextResponse } from 'next/server';

export default async function reportCspViolation(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await request.json();

  console.debug('CSP Violation:', body['csp-report']);

  return new NextResponse(null, { status: 204 });
}
