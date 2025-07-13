import { NextRequest, NextResponse } from 'next/server';
import { accept, findUserRemote, handle } from 'social-butterfly/activitystreams';

import { UserRemote } from '@prisma/client';
import crypto from 'crypto';
import forge from 'node-forge';
import { getLocalUser } from 'social-butterfly/db';
import magic from 'magic-signatures';

export default async function inbox(request: NextRequest) {
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

  try {
    const userRemote = await findUserRemote(body, user);

    if (!userRemote) {
      console.error('activitypub fail: ', body);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const success = verifyMessage(request, userRemote);
    if (!success) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await handle(body.type, request, body, user, userRemote);

    accept(request, user, userRemote, body);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error processing ActivityPub request:', error);
    return new NextResponse('Bad Request', { status: 400 });
  }
}

function verifyMessage(req: NextRequest, userRemote: UserRemote) {
  try {
    const signatureMap: { [key: string]: string } = {};
    const signature = req.headers.get('signature');
    if (!signature) {
      return false;
    }

    signature.split(',').forEach((keyValue: string) => {
      const keyValuePair = keyValue.split('=');
      signatureMap[keyValuePair[0]] = keyValuePair.slice(1).join('=').replace(/^"/, '').replace(/"$/, '');
    });

    const date = req.headers.get('date');
    if (!date) {
      return false;
    }

    if ((new Date().getTime() - new Date(date).getTime()) / 1000 < 60 * 5 /* 5 minutes */) {
      // Date is not within a reasonable time frame.
      return false;
    }

    const data = signatureMap['headers']
      .split(' ')
      .map((header) => {
        return header === '(request-target)'
          ? `(request-target): post ${req.nextUrl.pathname}`
          : `${header}: ${req.headers.get(header)}`;
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
  } catch {
    return false;
  }
}
