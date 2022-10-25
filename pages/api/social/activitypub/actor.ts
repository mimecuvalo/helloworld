import type { NextApiRequest, NextApiResponse } from 'next';
import { buildUrl, profileUrl } from 'util/url-factory';

import forge from 'node-forge';
import { getLocalUser } from 'social-butterfly/db';
import magic from 'magic-signatures';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const resource = req.query.resource as string;
  const user = await getLocalUser(resource);
  if (!user) {
    return res.status(404).end();
  }

  const actorUrl = buildUrl({ req, pathname: '/api/social/activitypub/actor', searchParams: { resource } });
  const inboxUrl = buildUrl({ req, pathname: '/api/social/activitypub/inbox', searchParams: { resource } });

  const json = {
    '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],

    id: actorUrl,
    type: 'Person',
    preferredUsername: user.username,
    inbox: inboxUrl,
    url: profileUrl(user.username, req),

    publicKey: {
      id: `${actorUrl}#main-key`,
      owner: actorUrl,
      publicKeyPem: forge.pki.publicKeyToPem(magic.magicToRSA(user.magicKey)),
    },
  };

  res.status(200).json(json);
}
