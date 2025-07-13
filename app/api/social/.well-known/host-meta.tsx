import { NextRequest, NextResponse } from 'next/server';
import { buildUrl } from 'util/url-factory';

export default async function hostMeta(request: NextRequest) {
  if (request.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const webFingerUrl = buildUrl({ req: request, pathname: `/.well-known/webfinger` });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0" xmlns:hm="http://host-meta.net/xrd/1.0">
        <hm:Host>${buildUrl({ req: request, pathname: '' })}</hm:Host>
        <Link rel="lrdd" type="application/json" template="${webFingerUrl}?resource={uri}" />
        <Link rel="lrdd" type="application/xrd+xml" template="${webFingerUrl}?format=xml&amp;resource={uri}" />
      </XRD>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xrd+xml',
      },
    });
  } catch (error) {
    console.error('Host-meta error:', error);
    return NextResponse.json({ error: 'Failed to generate host-meta' }, { status: 500 });
  }
}
