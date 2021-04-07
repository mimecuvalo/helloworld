import { findUserRemote, handle } from './activitystreams';

import fetch from 'node-fetch';
import { getUserRemoteInfo } from './discover_user';
import magic from 'magic-signatures';

export async function send(req, userRemote, contentOwner, data) {
  data = JSON.stringify(data);
  const body = magic.sign({ data, data_type: 'application/ld+json' }, contentOwner.private_key);
  body.sigs[0].value = magic.btob64u(body.sigs[0].value);

  await fetch(userRemote.salmon_url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/magic-envelope+json' },
  });
}

export default (options) => async (req, res) => {
  if (!req.query.resource) {
    return res.sendStatus(400);
  }
  const user = await options.getLocalUser(req.query.resource, req);
  if (!user) {
    return res.sendStatus(404);
  }

  const activityPubJSON = JSON.parse(magic.b64utob(req.body.data).toString('utf8'));

  const userRemote = await findUserRemote(options, activityPubJSON, res, user);

  if (!userRemote) {
    console.log('salmon fail: ', activityPubJSON);
    return res.sendStatus(401);
  }

  try {
    magic.verify(req.body, userRemote.magic_key);
  } catch (ex) {
    return res.sendStatus(401);
  }

  await handle(activityPubJSON.type, options, req, res, activityPubJSON, user, userRemote);

  res.sendStatus(204);
};
