import { accept, createArticle, findUserRemote, handle } from './activitystreams';
import { buildUrl } from './util/url_factory';
import crypto from 'crypto';
import express from 'express';
import fetch from 'node-fetch';
import forge from 'node-forge';
import magic from 'magic-signatures';

export default (options) => {
  const activityPubRouter = express.Router();

  activityPubRouter.get('/actor', Actor(options));
  activityPubRouter.post('/inbox', Inbox(options));
  activityPubRouter.get('/message', Message(options));

  return activityPubRouter;
};

const Actor = (options) => async (req, res, next) => {
  const resource = req.query.resource;
  const user = await options.getLocalUser(resource, req);
  if (!user) {
    return res.sendStatus(404);
  }

  const actorUrl = buildUrl({ req, pathname: '/api/social/activitypub/actor', searchParams: { resource } });
  const inboxUrl = buildUrl({ req, pathname: '/api/social/activitypub/inbox', searchParams: { resource } });

  const json = {
    '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],

    id: actorUrl,
    type: 'Person',
    preferredUsername: user.username,
    inbox: inboxUrl,
    url: user.url,

    publicKey: {
      id: `${actorUrl}#main-key`,
      owner: actorUrl,
      publicKeyPem: forge.pki.publicKeyToPem(magic.magicToRSA(user.magic_key)),
    },
  };

  res.json(json);
};

const Inbox = (options) => async (req, res, next) => {
  if (!req.query.resource) {
    return res.sendStatus(400);
  }
  const user = await options.getLocalUser(req.query.resource, req);
  if (!user) {
    return res.sendStatus(404);
  }

  const userRemote = await findUserRemote(options, req.body, res, user);

  if (!userRemote) {
    console.log('activitypub fail: ', req.body);
    return res.sendStatus(401);
  }

  const success = verifyMessage(req, userRemote);
  if (!success) {
    return res.sendStatus(401);
  }

  await handle(req.body.type, options, req, res, req.body, user, userRemote);

  accept(req, user, userRemote);

  res.sendStatus(204);
};

const Message = (options) => async (req, res, next) => {
  const content = await options.getLocalContent(req.query.resource, req);
  const user = await options.getLocalUser(req.query.resource, req);
  if (!content || !user) {
    return res.sendStatus(404);
  }

  const json = (await createArticle(req, content, user)).object;
  json['@context'] = 'https://www.w3.org/ns/activitystreams';
  res.json(json);
};

export async function send(req, userRemote, contentOwner, message) {
  const { currentDate, signatureHeader } = signMessage(req, contentOwner, userRemote);
  const inboxUrl = new URL(userRemote.activitypub_inbox_url);

  try {
    await fetch(userRemote.activitypub_inbox_url, {
      method: 'POST',
      body: JSON.stringify(message),
      headers: {
        Host: inboxUrl.hostname,
        Date: currentDate.toUTCString(),
        Signature: signatureHeader,
        'Content-Type': 'application/ld+json',
      },
    });
  } catch (ex) {
    // Not a big deal if this fails.
    // TODO(mime): add logging later.
  }
}

function signMessage(req, contentOwner, userRemote) {
  const currentDate = new Date();
  const inboxUrl = new URL(userRemote.activitypub_inbox_url);
  const signer = crypto
    .createSign('sha256')
    .update(`(request-target): post ${inboxUrl.pathname}${inboxUrl.search}\n`)
    .update(`host: ${inboxUrl.hostname}\n`)
    .update(`date: ${currentDate.toUTCString()}`)
    .end();
  const signature = signer.sign(contentOwner.private_key).toString('base64');
  const actorUrl = buildUrl({
    req,
    pathname: '/api/social/activitypub/actor',
    searchParams: { resource: contentOwner.url },
  });
  const signatureHeader = `keyId="${actorUrl}",headers="(request-target) host date",signature="${signature}"`;

  return { currentDate, signatureHeader };
}

function verifyMessage(req, userRemote) {
  try {
    const signatureMap = {};
    req.headers['signature'].split(',').forEach((keyValue) => {
      const keyValuePair = keyValue.split('=');
      signatureMap[keyValuePair[0]] = keyValuePair.slice(1).join('=').replace(/^"/, '').replace(/"$/, '');
    });

    if ((new Date() - new Date(req.headers['Date'])) / 1000 < 60 * 5 /* 5 minutes */) {
      // Date is not within a reasonable time frame.
      return false;
    }

    const data = signatureMap['headers']
      .split(' ')
      .map((header) => {
        return header === '(request-target)'
          ? `(request-target): post ${req.originalUrl}`
          : `${header}: ${req.headers[header]}`;
      })
      .join('\n');

    const verify = crypto.createVerify('sha256');
    verify.write(data);
    verify.end();

    let publicKey = userRemote.magic_key;
    if (publicKey.startsWith('RSA.')) {
      publicKey = forge.pki.publicKeyToPem(magic.magicToRSA(userRemote.magic_key));
    }

    return verify.verify(publicKey, signatureMap['signature'], 'base64');
  } catch (ex) {
    return false;
  }
}
