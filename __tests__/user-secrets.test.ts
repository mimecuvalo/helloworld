import { describe, expect, it, vi } from 'vitest';

vi.mock('server/config', () => ({ SECRETS_KEY: '', NODE_ENV: 'test' }));

import type { Context } from 'server/context';
import { currentUser, fetchAllUsers, fetchUser, stripSecrets } from 'server/services/user';
import { user } from './social/fixtures';

// A regression guard for a real leak: /api/users/current used to return the
// whole User row to the browser — RSA private key, atproto signing key, and
// (once Bluesky was linked) the app password and refresh token.
const SECRETS = ['privateKey', 'atprotoSigningKey', 'atprotoAppPassword', 'atprotoRefreshJwt'] as const;

const loaded = () =>
  user({
    privateKey: '-----BEGIN PRIVATE KEY-----secret-----END PRIVATE KEY-----',
    atprotoSigningKey: 'deadbeef'.repeat(8),
    atprotoAppPassword: 'abcd-efgh-ijkl-mnop',
    atprotoRefreshJwt: 'eyJhbGciOi.refresh.token',
  });

function context(overrides: Partial<Context> = {}) {
  return {
    currentUsername: 'alice',
    currentUser: loaded(),
    prisma: { user: { findMany: async () => [loaded(), loaded()] } },
    loaders: { users: { load: async () => [loaded()] } },
    ...overrides,
  } as unknown as Context;
}

function expectNoSecrets(payload: unknown) {
  const serialized = JSON.stringify(payload);
  for (const field of SECRETS) {
    expect(serialized).not.toContain(field);
  }
  expect(serialized).not.toContain('BEGIN PRIVATE KEY');
  expect(serialized).not.toContain('abcd-efgh-ijkl-mnop');
  expect(serialized).not.toContain('eyJhbGciOi.refresh.token');
}

describe('stripSecrets', () => {
  it('removes every secret field', () => {
    const safe = stripSecrets(loaded());

    for (const field of SECRETS) expect(safe).not.toHaveProperty(field);
    expectNoSecrets(safe);
  });

  it('keeps the fields the app actually needs', () => {
    const safe = stripSecrets(loaded());

    expect(safe).toMatchObject({ username: 'alice', name: 'Alice A', title: "Alice's site" });
    // magicKey is the *public* half and is published in the actor document.
    expect(safe).toHaveProperty('magicKey');
  });

  it('passes null through', () => {
    expect(stripSecrets(null)).toBeNull();
  });

  it('does not mutate the row it was given — the server still signs with it', () => {
    const original = loaded();
    stripSecrets(original);

    expect(original.privateKey).toContain('BEGIN PRIVATE KEY');
  });
});

describe('endpoints that return a user', () => {
  it('GET /api/users/current carries no secrets', () => {
    expectNoSecrets(currentUser(context()));
  });

  it('GET /api/users/all carries no secrets', async () => {
    expectNoSecrets(await fetchAllUsers(context()));
  });

  it('GET /api/users/:id carries no secrets', async () => {
    expectNoSecrets(await fetchUser(context(), 1));
  });

  it('still returns the user it was asked for', async () => {
    expect(currentUser(context())).toMatchObject({ username: 'alice' });
    expect(await fetchAllUsers(context())).toHaveLength(2);
    expect(await fetchUser(context(), 1)).toMatchObject({ username: 'alice' });
  });
});
