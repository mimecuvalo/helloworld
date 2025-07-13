import { NextRequest, NextResponse } from 'next/server';
import { buildUrl, profileUrl } from 'util/url-factory';

import forge from 'node-forge';
import { getLocalUser } from 'social-butterfly/db';
import magic from 'magic-signatures';

export default async function actor(request: NextRequest) {
  if (request.method !== 'GET') {
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

  const actorUrl = buildUrl({ req: request, pathname: '/api/social/activitypub/actor', searchParams: { resource } });
  const inboxUrl = buildUrl({ req: request, pathname: '/api/social/activitypub/inbox', searchParams: { resource } });

  const json = {
    '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],

    id: actorUrl,
    type: 'Person',
    preferredUsername: user.username,
    inbox: inboxUrl,
    url: profileUrl(user.username, request),

    publicKey: {
      id: `${actorUrl}#main-key`,
      owner: actorUrl,
      publicKeyPem: forge.pki.publicKeyToPem(magic.magicToRSA(user.magicKey)),
    },
  };

  return NextResponse.json(json);
}
