import type { User } from '../generated/prisma/client';

// Fields that must never reach a browser: two PEM private keys and the Bluesky
// credentials. ctx.currentUser is selected column by column (see below) so
// these never load in the first place — anything that actually signs or talks
// to a PDS asks for the whole row via ctx.fullUser(). Rows read any other way
// still go through stripSecrets before they're returned to a client.
export const SECRET_USER_FIELDS = [
  'privateKey',
  'ed25519PrivateKey',
  'atprotoSigningKey',
  'atprotoAppPassword',
  'atprotoRefreshJwt',
] as const;

export type SecretUserField = (typeof SECRET_USER_FIELDS)[number];

export type SafeUser = Omit<User, SecretUserField>;

// What ctx.currentUser carries: who you are, plus the handful of chrome fields
// the dashboard and the profile form read on the way through. Not-secret isn't
// the bar — *read on this request* is. Everything left out (sidebarHtml and
// magicKey especially, both long text columns) is either published anyway or
// belongs to a flow that does its own read, so hauling it out of Postgres on
// every authenticated request bought nothing.
//
// The constraint is `Exclude<..., SecretUserField>`: naming a secret column
// here doesn't compile, so this list can never quietly reintroduce one.
export const CURRENT_USER_SELECT = {
  id: true,
  username: true,
  email: true,
  name: true,
  superuser: true,
  // Site chrome, for the dashboard nav and the edit-profile form.
  title: true,
  description: true,
  favicon: true,
  logo: true,
  license: true,
  theme: true,
  // Linked accounts, only enough to label the two panels in the dashboard nav.
  // Each dialog fetches its own real status.
  atprotoDid: true,
  atprotoHandle: true,
  mastodonUrl: true,
} as const satisfies Partial<Record<Exclude<keyof User, SecretUserField>, true>>;

export type CurrentUser = Pick<User, keyof typeof CURRENT_USER_SELECT>;

// Generic over the row it's given: a whole User comes back as a SafeUser, and a
// row that was already selected narrowly (CurrentUser) keeps its own shape
// rather than being widened back into one that claims columns it never loaded.
export function stripSecrets<T extends object>(user: T): Omit<T, SecretUserField>;
export function stripSecrets<T extends object>(user: T | null): Omit<T, SecretUserField> | null;
export function stripSecrets<T extends object>(user: T | null): Omit<T, SecretUserField> | null {
  if (!user) return null;

  const safe = { ...user } as T & Partial<Record<SecretUserField, unknown>>;
  for (const field of SECRET_USER_FIELDS) delete safe[field];
  return safe;
}
