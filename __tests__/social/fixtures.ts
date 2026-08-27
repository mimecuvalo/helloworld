import crypto from 'node:crypto';
import { generateEd25519Key } from 'server/social/integrity-proof';
import type { Content, ContentRemote, User, UserRemote } from '../../generated/prisma/client';

export const HOST = 'example.com';

// A stable, real RSA keypair is expensive to generate per-test; make one lazily
// and share it across the suite that needs to sign/verify for real.
let cachedKeys: { publicKey: string; privateKey: string; privateKeyPkcs1: string } | undefined;
export function keys() {
  if (!cachedKeys) {
    const pair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const privateKeyPkcs1 = crypto
      .createPrivateKey(pair.privateKey)
      .export({ type: 'pkcs1', format: 'pem' })
      .toString();
    cachedKeys = { ...pair, privateKeyPkcs1 };
  }
  return cachedKeys;
}

// The Ed25519 half, for FEP-8b32 object integrity proofs. Same lazy-and-shared
// reasoning as keys() above, though this one is cheap to make.
let cachedProofKeys: ReturnType<typeof generateEd25519Key> | undefined;
export function proofKeys() {
  if (!cachedProofKeys) cachedProofKeys = generateEd25519Key();
  return cachedProofKeys;
}

export function user(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    username: 'alice',
    name: 'Alice A',
    email: 'alice@example.com',
    superuser: false,
    title: "Alice's site",
    description: 'a site',
    hostname: null,
    license: null,
    googleAnalytics: null,
    favicon: '/favicon.jpg',
    logo: null,
    viewport: null,
    sidebarHtml: null,
    theme: 'flowers',
    magicKey: '',
    privateKey: '',
    ed25519PrivateKey: null,
    ...overrides,
  } as User;
}

export function content(overrides: Partial<Content> = {}): Content {
  return {
    id: 10,
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-02T00:00:00.000Z'),
    username: 'alice',
    section: 'blog',
    album: 'main',
    name: 'hello',
    template: null,
    sortType: null,
    redirect: 0,
    hidden: false,
    title: 'Hello',
    thumb: '',
    order: 0,
    count: 0,
    countRobot: 0,
    commentsCount: 0,
    commentsUpdated: null,
    thread: null,
    threadUser: null,
    avatar: null,
    style: '',
    code: '',
    view: '<p>hi</p>',
    favoritesCount: 0,
    ...overrides,
  } as Content;
}

export function userRemote(overrides: Partial<UserRemote> = {}): UserRemote {
  return {
    id: 5,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    localUsername: 'alice',
    username: 'bob',
    name: 'Bob B',
    profileUrl: 'https://remote.example/bob',
    feedUrl: 'https://remote.example/bob/feed',
    magicKey: null,
    ed25519PublicKey: null,
    salmonUrl: null,
    activityPubActorUrl: 'https://remote.example/users/bob',
    activityPubInboxUrl: null,
    webmentionUrl: null,
    hubUrl: null,
    follower: false,
    following: true,
    avatar: 'https://remote.example/bob.jpg',
    favicon: null,
    order: 0,
    sortType: null,
    ...overrides,
  } as UserRemote;
}

export function contentRemote(overrides: Partial<ContentRemote> = {}): ContentRemote {
  return {
    id: 20,
    createdAt: new Date('2026-03-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    toUsername: 'alice',
    localContentName: 'hello',
    fromUsername: 'https://remote.example/bob',
    fromUserRemoteId: '5',
    commentUser: null,
    username: 'bob',
    creator: 'Bob B',
    avatar: 'https://remote.example/bob.jpg',
    title: 'A comment',
    postId: 'https://remote.example/bob/1',
    link: 'https://remote.example/bob/1',
    commentsUpdated: null,
    commentsCount: 0,
    thread: null,
    type: 'comment',
    favorited: false,
    read: false,
    isSpam: false,
    deleted: false,
    view: '<p>nice</p>',
    ...overrides,
  } as ContentRemote;
}
