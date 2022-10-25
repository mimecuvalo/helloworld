import type { NextApiRequest, NextApiResponse } from 'next';
import { findUserRemote, handle } from '../../../social-butterfly/activitystreams';

import { getLocalUser } from 'social-butterfly/db';
import magic from 'magic-signatures';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!req.query.resource) {
    return res.status(400).end();
  }
  const user = await getLocalUser(req.query.resource as string);
  if (!user) {
    return res.status(404).end();
  }

  const activityPubJSON = JSON.parse(magic.b64utob(req.body.data).toString('utf8'));

  const userRemote = await findUserRemote(activityPubJSON, res, user);

  if (!userRemote) {
    console.log('salmon fail: ', activityPubJSON);
    return res.status(401).end();
  }

  try {
    magic.verify(req.body, userRemote.magicKey);
  } catch (ex) {
    return res.status(401).end();
  }

  await handle(activityPubJSON.type, req, res, activityPubJSON, user, userRemote);

  res.status(204).end();
}
