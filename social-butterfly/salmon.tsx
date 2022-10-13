import { findUserRemote, handle } from './activitystreams';

import magic from 'magic-signatures';

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
