import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import crypto from 'crypto';
import { follow } from 'social-butterfly/activitystreams';
import magic from 'magic-signatures';
import prisma from 'data/prisma';

// TODO(mime): all this user creation logic has to go somewhere else so we can reuse it later.
export default async function setup(request: NextRequest) {
  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const anyUser = await prisma?.user.findFirst();
    if (anyUser) {
      return NextResponse.json({ error: 'already setup.' }, { status: 400 });
    }

    const username = 'me';

    // Setup 'magic key' for signing Salmon envelopes.
    const { magicKey, privateKey } = generateMagicKey();

    const newUser = await prisma?.user.create({
      data: {
        description: 'Just another Hello, world blog',
        email: 'example@mail.com',
        favicon: '/favicon.jpg',
        googleAnalytics: '',
        hostname: '',
        license: '',
        logo: '',
        magicKey,
        name: 'Just another Hello, world user',
        privateKey,
        superuser: true,
        theme: '/css/themes/pixel.css',
        title: 'Hello, world.',
        username,
        viewport: '',
      },
    });

    await prisma?.content.createMany({
      data: [
        createStubContent({ username, section: 'main', name: 'home', title: 'Hello, world.', template: 'feed' }),
        createStubContent({ username, section: 'main', name: 'photos', title: 'photos', template: 'album' }),
        createStubContent({ username, section: 'main', name: 'microblog', title: 'microblog', template: 'feed' }),
        createStubContent({ username, section: 'main', name: 'reblogged', title: 'reblogged', template: 'feed' }),
        createStubContent({ username, section: 'main', name: 'links', title: 'links', template: 'album' }),
        createStubContent({ username, section: 'main', name: 'about', view: 'I like turtles.' }),
        createStubContent({ username, section: 'main', name: 'comments', hidden: true }),
        createStubContent({ username, section: 'microblog', name: 'first', title: 'first!', view: 'Hello, world.' }),
      ],
    });

    // Give a feed to follow to start with.
    follow(request, newUser as User, { profileUrl: 'https://kottke.org' }, true /* isFollow */);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}

function createStubContent({
  username,
  section,
  name,
  template,
  hidden,
  title,
  view,
}: {
  username: string;
  section: string;
  name: string;
  template?: string;
  hidden?: boolean;
  title?: string;
  view?: string;
}) {
  return {
    username,
    section,
    album: '',
    name,
    template: template || '',
    title: title || '',
    hidden,
    content: '',
    thumb: '',
    style: '',
    code: '',
    view: view || '',
  };
}

function generateMagicKey() {
  const key = crypto.generateKeyPairSync('rsa', {
    modulusLength: 1024,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });
  const magicKey = magic.RSAToMagic(key.publicKey);
  const privateKey = key.privateKey;

  return { magicKey, privateKey };
}
