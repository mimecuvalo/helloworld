import type { User } from '../generated/prisma/client';

// Fields that must never reach a browser: two PEM private keys and the Bluesky
// credentials. They are also the largest columns on the row and the ones almost
// no request needs, so ctx.currentUser is selected without them — anything that
// actually signs or talks to a PDS asks for the whole row via ctx.fullUser().
// Anything returned to a client still goes through stripSecrets first.
export const SECRET_USER_FIELDS = [
  'privateKey',
  'ed25519PrivateKey',
  'atprotoSigningKey',
  'atprotoAppPassword',
  'atprotoRefreshJwt',
] as const;

export type SecretUserField = (typeof SECRET_USER_FIELDS)[number];

export type SafeUser = Omit<User, SecretUserField>;

// The same list in the shape Prisma's `omit` wants. `satisfies` keeps the two
// in step: adding a secret column to the list above without adding it here
// stops compiling, rather than quietly loading the secret on every request.
export const OMIT_USER_SECRETS = {
  privateKey: true,
  ed25519PrivateKey: true,
  atprotoSigningKey: true,
  atprotoAppPassword: true,
  atprotoRefreshJwt: true,
} as const satisfies Record<SecretUserField, true>;

export function stripSecrets(user: User | SafeUser): SafeUser;
export function stripSecrets(user: User | SafeUser | null): SafeUser | null;
export function stripSecrets(user: User | SafeUser | null): SafeUser | null {
  if (!user) return null;

  const safe = { ...user } as User & Partial<Record<SecretUserField, unknown>>;
  for (const field of SECRET_USER_FIELDS) delete safe[field];
  return safe as SafeUser;
}
