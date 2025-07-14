import { NextRequest, NextResponse } from 'next/server';

export const POST = async (request: NextRequest) => {
  const body = await request.json();

  console.debug('CSP Violation:', body['csp-report']);

  return new NextResponse(null, { status: 204 });
};
