import prisma from '../server/prisma';
import { generateMagicKey } from '../server/services/user';
import { generateSigningKey } from '../server/social/atproto-identity';
import { generateEd25519Key } from '../server/social/integrity-proof';
import { encryptSecret } from '../server/secrets';

const username = process.env.BOOTSTRAP_USERNAME?.trim();
const email = process.env.BOOTSTRAP_EMAIL?.trim();

if (!username || !email) {
  throw new Error('Set BOOTSTRAP_USERNAME and BOOTSTRAP_EMAIL before running db:bootstrap.');
}

if (await prisma.user.findFirst({ select: { id: true } })) {
  throw new Error('Bootstrap refused: the database already contains a user.');
}

const { magicKey, privateKey } = generateMagicKey();
// AT Protocol identity key, backing the did:web document.
const { privateKeyHex: atprotoSigningKey } = await generateSigningKey();
// Ed25519 key for FEP-8b32 object integrity proofs.
const { privateKeyPem: ed25519PrivateKey } = generateEd25519Key();
const content = [
  { section: 'main', name: 'home', title: 'Hello, world.', template: 'feed' },
  { section: 'main', name: 'photos', title: 'photos', template: 'album' },
  { section: 'main', name: 'microblog', title: 'microblog', template: 'feed' },
  { section: 'main', name: 'reblogged', title: 'reblogged', template: 'feed' },
  { section: 'main', name: 'links', title: 'links', template: 'album' },
  { section: 'main', name: 'about', title: '', view: 'I like turtles.' },
  { section: 'main', name: 'comments', title: '', hidden: true },
  { section: 'microblog', name: 'first', title: 'first!', view: 'Hello, world.' },
];

await prisma.$transaction(async (tx) => {
  await tx.user.create({
    data: {
      username,
      email,
      name: username,
      title: 'Hello, world.',
      description: 'Just another Hello, world blog',
      favicon: '/favicon.jpg',
      theme: 'nightlight',
      superuser: true,
      magicKey,
      privateKey: encryptSecret(privateKey),
      atprotoSigningKey: encryptSecret(atprotoSigningKey),
      ed25519PrivateKey: encryptSecret(ed25519PrivateKey),
    },
  });
  await tx.content.createMany({
    data: content.map((item) => ({
      username,
      section: item.section,
      album: '',
      name: item.name,
      template: item.template || '',
      title: item.title,
      hidden: item.hidden || false,
      thumb: '',
      style: '',
      code: '',
      view: item.view || '',
    })),
  });
});

console.info(`Bootstrapped superuser ${username}.`);
await prisma.$disconnect();
