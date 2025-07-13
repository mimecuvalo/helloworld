import { NextRequest, NextResponse } from 'next/server';
import { findUserRemote, handle } from 'social-butterfly/activitystreams';

import { getLocalUser } from 'social-butterfly/db';
import magic from 'magic-signatures';

export default async function salmon(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { searchParams } = request.nextUrl;
  const resource = searchParams.get('resource');

  if (!resource) {
    return new NextResponse('Missing resource parameter', { status: 400 });
  }

  const user = await getLocalUser(resource);
  if (!user) {
    return new NextResponse('User not found', { status: 404 });
  }

  const body = await request.json();
  const activityPubJSON = JSON.parse(magic.b64utob(body.data).toString('utf8'));

  try {
    const userRemote = await findUserRemote(activityPubJSON, user);

    if (!userRemote) {
      console.error('salmon fail: ', activityPubJSON);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
      magic.verify(body, userRemote.magicKey);
    } catch {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await handle(activityPubJSON.type, request, activityPubJSON, user, userRemote);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error processing salmon request:', error);
    return new NextResponse('Bad Request', { status: 400 });
  }
}
