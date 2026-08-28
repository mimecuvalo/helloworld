import crypto from 'crypto';
import magic from 'magic-signatures';
import type { Context } from '../context';
import type { User } from '../../generated/prisma/client';
import { AtpAgent } from '@atproto/api';
import { assertAuthor } from '../authorization';
import { HTTPError } from '../exceptions';
import { encryptSecret } from '../secrets';
import { OMIT_USER_SECRETS, stripSecrets } from '../user-secrets';
import { PUBLIC_BSKY_PDS, didForUser, generateSigningKey } from '../social/atproto-identity';
import { generateEd25519Key } from '../social/integrity-proof';
import { profileUrl } from '../../lib/url-factory';
import { DEFAULT_THEME, themeGlobalCss } from '../../styles/theme-css';

// RSA keypair for signing federation (Salmon / magic-envelope / ActivityPub HTTP
// signature) messages. Ported from the old pages/api/setup.ts — a user created
// without these can't federate.
//
// 2048 bits, not the 1024 this used to generate: Mastodon and most other
// ActivityPub implementations reject 1024-bit keys outright, so a user created
// with one can't be followed from the fediverse. Users created before this still
// hold a 1024-bit key — see scripts/rotate-keys.ts.
export function generateMagicKey(): { magicKey: string; privateKey: string } {
  const key = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { magicKey: magic.RSAToMagic(key.publicKey), privateKey: key.privateKey };
}

// ctx.currentUser is already selected without the secret columns; this is the
// belt-and-braces pass for rows loaded any other way.
export { stripSecrets, type SafeUser } from '../user-secrets';

export function currentUser(ctx: Context) {
  return stripSecrets(ctx.currentUser);
}

export async function fetchAllUsers(ctx: Context) {
  return (await ctx.prisma.user.findMany()).map(stripSecrets);
}

export async function fetchUser(ctx: Context, id: number) {
  const user = ((await ctx.loaders.users.load(id)) as User[] | undefined)?.[0] ?? null;
  return stripSecrets(user);
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
  mastodonUrl: true,
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

export async function createUser(ctx: Context, input: { username: string; email: string }) {
  const { magicKey, privateKey } = generateMagicKey();
  const { privateKeyHex } = await generateSigningKey();
  const { privateKeyPem } = generateEd25519Key();
  return ctx.prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      name: '',
      title: '',
      theme: '',
      magicKey,
      privateKey: encryptSecret(privateKey),
      atprotoSigningKey: encryptSecret(privateKeyHex),
      ed25519PrivateKey: encryptSecret(privateKeyPem),
    },
  });
}

// What "edit profile" edits: the identity and chrome of the site, not its
// plumbing. Federation keys, hostname routing and the linked-account fields
// each have their own flow and stay out of a free-text form.
export type ProfileInput = {
  name: string;
  title: string;
  description?: string | null;
  favicon?: string | null;
  logo?: string | null;
  license?: string | null;
  theme: string;
};

export function fetchProfile(ctx: Context) {
  assertAuthor(ctx);

  const user = ctx.currentUser!;
  return {
    username: user.username,
    name: user.name,
    title: user.title,
    description: user.description,
    favicon: user.favicon,
    logo: user.logo,
    license: user.license,
    theme: user.theme || DEFAULT_THEME,
    themes: Object.keys(themeGlobalCss),
  };
}

// Both of these render into href/src attributes, so a scheme that isn't http(s)
// has no business here — an empty string is how you clear one.
function cleanImageUrl(value: string | null | undefined, field: string): string | null {
  const url = (value || '').trim();
  if (!url) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !/^https?:/i.test(url)) {
    throw new HTTPError(400, url, `The ${field} has to be an http(s) url or a path on this site.`);
  }
  return url;
}

export async function updateProfile(ctx: Context, input: ProfileInput) {
  assertAuthor(ctx);

  const theme = input.theme || DEFAULT_THEME;
  if (!(theme in themeGlobalCss)) {
    throw new HTTPError(400, theme, 'That theme does not exist.');
  }

  const name = input.name.trim();
  if (!name) {
    throw new HTTPError(400, undefined, 'A name is required.');
  }

  ctx.currentUser = await ctx.prisma.user.update({
    where: { username: ctx.currentUsername },
    omit: OMIT_USER_SECRETS,
    data: {
      name,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      favicon: cleanImageUrl(input.favicon, 'favicon'),
      logo: cleanImageUrl(input.logo, 'logo'),
      license: input.license?.trim() || null,
      theme,
    },
  });

  return fetchProfile(ctx);
}

// The AT Protocol signing key backs the did:web document. Users created before
// atproto support don't have one, so provision it on demand rather than
// requiring a migration.
//
// Takes the row rather than a username: every caller already holds one (it's
// ctx.currentUser), so looking it up again was a wasted SELECT of every column.
export async function ensureAtprotoSigningKey(ctx: Context, user: User): Promise<string> {
  if (user.atprotoSigningKey) return user.atprotoSigningKey;

  const { privateKeyHex } = await generateSigningKey();
  await ctx.prisma.user.update({
    where: { id: user.id },
    data: { atprotoSigningKey: encryptSecret(privateKeyHex) },
  });
  return privateKeyHex;
}

// Links a Bluesky account. The app password is verified by actually logging in
// — a typo should fail here, not silently at the next publish.
export async function linkAtprotoAccount(
  ctx: Context,
  input: { handle: string; appPassword?: string; pdsUrl?: string }
): Promise<{ did: string; handle: string; pdsUrl: string }> {
  assertAuthor(ctx);

  const handle = input.handle.trim().replace(/^@/, '');
  const pdsUrl = input.pdsUrl?.trim() || PUBLIC_BSKY_PDS;

  const appPassword = input.appPassword;
  if (!appPassword) {
    throw new HTTPError(400, pdsUrl, 'No app password given.');
  }

  const agent = new AtpAgent({ service: pdsUrl });
  let session;
  try {
    const response = await agent.login({ identifier: handle, password: appPassword });
    session = response.data;
  } catch {
    throw new HTTPError(400, pdsUrl, 'Could not sign in to Bluesky with that handle and app password.');
  }

  await ensureAtprotoSigningKey(ctx, (await ctx.fullUser())!);
  await ctx.prisma.user.update({
    where: { username: ctx.currentUsername },
    data: {
      atprotoDid: session.did,
      atprotoHandle: session.handle,
      atprotoPdsUrl: pdsUrl,
      atprotoAppPassword: encryptSecret(appPassword),
      atprotoRefreshJwt: encryptSecret(session.refreshJwt),
    },
  });

  return { did: session.did, handle: session.handle, pdsUrl };
}

// Mastodon "linking" is not a credential handshake — this site is already an
// ActivityPub server, so a Mastodon user follows it directly. What a link
// buys you is rel="me" verification: Mastodon fetches the URL in your profile
// metadata and, if it links back here, marks that field verified.
export function fetchMastodonStatus(ctx: Context) {
  assertAuthor(ctx);

  const user = ctx.currentUser!;
  return {
    mastodonUrl: user.mastodonUrl || null,
    // What to paste into the Mastodon profile field, and the handle peers use.
    profileUrl: profileUrl(user.username, ctx.hostname),
    fediverseHandle: `@${user.username}@${ctx.hostname}`,
  };
}

export async function linkMastodonAccount(ctx: Context, input: { mastodonUrl: string }) {
  assertAuthor(ctx);

  const raw = input.mastodonUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new HTTPError(400, raw, 'That does not look like a profile URL (try https://mastodon.social/@you).');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new HTTPError(400, raw, 'A profile URL has to be http(s).');
  }

  await ctx.prisma.user.update({ where: { username: ctx.currentUsername }, data: { mastodonUrl: parsed.toString() } });
  ctx.currentUser!.mastodonUrl = parsed.toString();
  return fetchMastodonStatus(ctx);
}

export async function unlinkMastodonAccount(ctx: Context): Promise<boolean> {
  assertAuthor(ctx);

  await ctx.prisma.user.update({ where: { username: ctx.currentUsername }, data: { mastodonUrl: null } });
  ctx.currentUser!.mastodonUrl = null;
  return true;
}

export async function unlinkAtprotoAccount(ctx: Context): Promise<boolean> {
  assertAuthor(ctx);

  await ctx.prisma.user.update({
    where: { username: ctx.currentUsername },
    // The signing key stays: it's the did:web identity, not the Bluesky link.
    data: {
      atprotoDid: null,
      atprotoHandle: null,
      atprotoPdsUrl: null,
      atprotoAppPassword: null,
      atprotoRefreshJwt: null,
    },
  });
  return true;
}

// What the dashboard needs to render the link panel. Never returns the app
// password.
export async function fetchAtprotoStatus(ctx: Context) {
  assertAuthor(ctx);

  // One of the few reads that wants the whole row: it provisions the signing key
  // and reports on the app password. Only runs when the dialog is opened.
  const user = (await ctx.fullUser())!;

  // Provision the signing key here rather than only on link: the dashboard
  // shows the did:web id, and without a key the DID document 404s — advertising
  // an identity that doesn't resolve.
  await ensureAtprotoSigningKey(ctx, user);

  return {
    did: user.atprotoDid || null,
    handle: user.atprotoHandle || null,
    pdsUrl: user.atprotoPdsUrl || null,
    // Linked either way: the password may live in the environment rather than
    // the row, in which case atprotoAppPassword is deliberately null.
    linked: !!(user.atprotoHandle && user.atprotoAppPassword),
    webDid: didForUser(ctx.hostname, user),
  };
}
