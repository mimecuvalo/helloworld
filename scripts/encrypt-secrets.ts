// One-time migration: encrypt the secrets already sitting in the User table.
//
// Rows written before server/secrets.ts existed hold plaintext. Reads already
// tolerate both (decryptSecret passes an unprefixed value straight through), so
// this can run whenever — but until it does, those rows stay readable to anyone
// with the database.
//
//   SECRETS_KEY=... DATABASE_URL=... bun scripts/encrypt-secrets.ts --dry-run
//   SECRETS_KEY=... DATABASE_URL=... bun scripts/encrypt-secrets.ts
//
// Safe to re-run: an already-encrypted value is left alone.

import { encryptSecret, isEncrypted, isSecretsKeyConfigured } from '../server/secrets';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Name the database you mean — this rewrites every user row.');
  process.exit(1);
}

if (!isSecretsKeyConfigured()) {
  console.error(`SECRETS_KEY is not set, so there is nothing to encrypt with.

Generate one and keep it somewhere you will not lose it — without it, every
encrypted secret in the database becomes unreadable:

  openssl rand -hex 32`);
  process.exit(1);
}

const { default: prisma } = await import('../server/prisma');

const SECRET_FIELDS = ['privateKey', 'atprotoSigningKey', 'atprotoAppPassword', 'atprotoRefreshJwt'] as const;
const dryRun = process.argv.includes('--dry-run');

const { host, pathname } = new URL(process.env.DATABASE_URL);
console.log(`database: ${host}${pathname}${dryRun ? '  (dry run)' : ''}\n`);

const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    privateKey: true,
    atprotoSigningKey: true,
    atprotoAppPassword: true,
    atprotoRefreshJwt: true,
  },
});

let changed = 0;
for (const user of users) {
  const updates: Record<string, string> = {};
  const encryptedFields: string[] = [];

  for (const field of SECRET_FIELDS) {
    const value = user[field];
    if (!value || isEncrypted(value)) continue;
    updates[field] = encryptSecret(value);
    encryptedFields.push(field);
  }

  if (!encryptedFields.length) {
    console.log(`${user.username.padEnd(24)} already encrypted (or empty)`);
    continue;
  }

  if (!dryRun) await prisma.user.update({ where: { id: user.id }, data: updates });
  console.log(`${user.username.padEnd(24)} ${dryRun ? 'would encrypt' : 'encrypted'}: ${encryptedFields.join(', ')}`);
  changed++;
}

console.log(
  changed === 0
    ? '\nNothing to do — every secret is already encrypted.'
    : dryRun
      ? `\n${changed} user(s) would be updated. Re-run without --dry-run to apply.`
      : `\n${changed} user(s) updated. Keep SECRETS_KEY safe: these values cannot be read without it.`
);
