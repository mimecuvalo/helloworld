import type { NextApiRequest, NextApiResponse } from 'next';
import { accept, findUserRemote, handle } from 'social-butterfly/activitystreams';

import { UserRemote } from '@prisma/client';
import crypto from 'crypto';
import forge from 'node-forge';
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

  const userRemote = await findUserRemote(req.body, res, user);

  if (!userRemote) {
    console.log('activitypub fail: ', req.body);
    return res.status(401).end();
  }

  const success = verifyMessage(req, userRemote);
  if (!success) {
    return res.status(401).end();
  }

  await handle(req.body.type, req, res, req.body, user, userRemote);

  accept(req, user, userRemote);

  res.status(204).end();
}

function verifyMessage(req: NextApiRequest, userRemote: UserRemote) {
  try {
    const signatureMap: { [key: string]: string } = {};
    (req.headers['signature'] as string).split(',').forEach((keyValue: string) => {
      const keyValuePair = keyValue.split('=');
      signatureMap[keyValuePair[0]] = keyValuePair.slice(1).join('=').replace(/^"/, '').replace(/"$/, '');
    });

    if ((new Date().getTime() - new Date(req.headers['Date'] as string).getTime()) / 1000 < 60 * 5 /* 5 minutes */) {
      // Date is not within a reasonable time frame.
      return false;
    }

    const data = signatureMap['headers']
      .split(' ')
      .map((header) => {
        return header === '(request-target)'
          ? `(request-target): post ${req.url}`
          : `${header}: ${req.headers[header]}`;
      })
      .join('\n');

    const verify = crypto.createVerify('sha256');
    verify.write(data);
    verify.end();

    let publicKey = userRemote.magicKey || '';
    if (publicKey.startsWith('RSA.')) {
      publicKey = forge.pki.publicKeyToPem(magic.magicToRSA(userRemote.magicKey));
    }

    return verify.verify(publicKey, signatureMap['signature'], 'base64');
  } catch (ex) {
    return false;
  }
}
