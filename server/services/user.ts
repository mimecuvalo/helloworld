import crypto from 'crypto';
import magic from 'magic-signatures';
import type { Context } from '../context';
import type { User } from '../../generated/prisma/client';

// RSA keypair for signing federation (Salmon / magic-envelope) messages. Ported
// from the old pages/api/setup.ts — a user created without these can't federate.
export function generateMagicKey(): { magicKey: string; privateKey: string } {
  const key = crypto.generateKeyPairSync('rsa', {
    modulusLength: 1024,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { magicKey: magic.RSAToMagic(key.publicKey), privateKey: key.privateKey };
}

export function currentUser(ctx: Context) {
  return ctx.currentUser;
}

export function fetchAllUsers(ctx: Context) {
  return ctx.prisma.user.findMany();
}

export async function fetchUser(ctx: Context, id: number) {
  return ((await ctx.loaders.users.load(id)) as User[] | undefined)?.[0] ?? null;
}

const PUBLIC_USER_SELECT = {
  username: true,
  name: true,
  title: true,
  email: true,
  description: true,
  license: true,
  googleAnalytics: true,
  favicon: true,
  logo: true,
  theme: true,
  viewport: true,
  sidebarHtml: true,
} as const;

export async function fetchPublicUserData(ctx: Context, usernameArg?: string | null) {
  const { hostname, prisma } = ctx;
  let username = usernameArg || undefined;

  if (hostname) {
    const hostnameUserData = await prisma.user.findFirst({ select: { username: true }, where: { hostname } });
    if (hostnameUserData) {
      username = hostnameUserData.username;
    }
  }

  if (!username) {
    username = (await prisma.user.findUnique({ select: { username: true }, where: { id: 1 } }))?.username;
  }

  if (!username) return null;

  return prisma.user.findUnique({ select: PUBLIC_USER_SELECT, where: { username } });
}

// XXX(mime): might not need this anymore?
export function fetchPublicUserDataSearch(ctx: Context, username?: string | null) {
  return fetchPublicUserData(ctx, username);
}

export function createUser(ctx: Context, input: { username: string; email: string }) {
  const { magicKey, privateKey } = generateMagicKey();
  return ctx.prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      name: '',
      title: '',
      theme: '',
      magicKey,
      privateKey,
    },
  });
}
