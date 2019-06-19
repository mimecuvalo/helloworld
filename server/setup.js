import crypto from 'crypto';
import magic from 'magic-signatures';
import models from './data/models';
import socialButterfly from './social-butterfly';

// TODO(mime): all this user creation logic has to go somewhere else so we can reuse it later.
export default async function setup() {
  const username = 'me';

  // Setup 'magic key' for signing Salmon envelopes.
  const { magic_key, private_key } = generateMagicKey();

  const newUser = await models.User.create({
    description: 'Just another Hello, world blog',
    email: 'example@mail.com',
    favicon: '/favicon.ico',
    google_analytics: '',
    hostname: '',
    license: '',
    logo: '',
    magic_key,
    name: 'Just another Hello, world user',
    private_key,
    superuser: true,
    theme: '/css/themes/pixel.css',
    title: 'Hello, world.',
    username,
    viewport: '',
  });

  await models.Content.bulkCreate([
    createStubContent({ username, section: 'main', name: 'home', title: 'Hello, world.', template: 'feed' }),
    createStubContent({ username, section: 'main', name: 'photos', title: 'photos', template: 'album' }),
    createStubContent({ username, section: 'main', name: 'microblog', title: 'microblog', template: 'feed' }),
    createStubContent({ username, section: 'main', name: 'reblogged', title: 'reblogged', template: 'feed' }),
    createStubContent({ username, section: 'main', name: 'links', title: 'links', template: 'album' }),
    createStubContent({ username, section: 'main', name: 'about', view: 'I like turtles.' }),
    createStubContent({ username, section: 'main', name: 'comments', hidden: true }),
    createStubContent({ username, section: 'microblog', name: 'first', title: 'first!', view: 'Hello, world.' }),
  ]);

  // Give a feed to follow to start with.
  await socialButterfly().follow(null /* req */, { model: newUser }, 'https://kottke.org');
}

function createStubContent({ username, section, name, template, hidden, title, view }) {
  return {
    username,
    section,
    album: '',
    name,
    template: template || '',
    title: title || '',
    hidden,
    content: '',
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
  const magic_key = magic.RSAToMagic(key.publicKey);
  const private_key = key.privateKey;

  return { magic_key, private_key };
}
