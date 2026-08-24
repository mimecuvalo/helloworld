import forge from 'node-forge';
import magic from 'magic-signatures';
import { generateMagicKey } from '../server/services/user';
import { encryptSecret } from '../server/secrets';

// Opt-in rotation of a user's federation keypair.
//
// generateMagicKey() used to emit 1024-bit RSA, which Mastodon and most other
// ActivityPub servers refuse; anyone created before that fix needs a new key to
// be followable from the fediverse.
//
// This is NOT free: peers cache the public key they fetched from the actor
// document, and rotating invalidates every cached copy. Well-behaved servers
// refetch on a verification failure, but some will simply drop your messages
// until they do. Rotate deliberately, not on a schedule.
//
//   bun run rotate-keys -- --list
//   bun run rotate-keys -- <username>
//   bun run rotate-keys -- --all-weak

// Env files are loaded by vite.config.mts, so a script run straight through bun
// gets nothing. Without this guard the pg adapter falls back to libpq defaults
// and quietly connects to a local database named after $USER — which reads as
// "the table does not exist" rather than "you have no DATABASE_URL".
//
// It's required rather than defaulted on purpose: prisma/.env points at
// production, and rotating keys there breaks federation for real peers.
if (!process.env.DATABASE_URL) {
  console.error(`DATABASE_URL is not set, and this script does not read prisma/.env for you.

Point it at a database explicitly, e.g. for local dev:

  DATABASE_URL=postgresql://mime@localhost:5432/helloworld_dev bun scripts/rotate-keys.ts --list

Rotating against production invalidates the public key every peer has cached,
so name the database you mean.`);
  process.exit(1);
}

// Imported after the guard: server/prisma.ts opens the connection on import.
const { default: prisma } = await import('../server/prisma');

// Which database is about to be touched — prod and local are one flag apart.
// Host and database name only; never the credentials in between.
function describeDatabase(url: string): string {
  try {
    const { host, pathname } = new URL(url);
    return `${host}${pathname}`;
  } catch {
    return '(unparseable DATABASE_URL)';
  }
}

// magicToRSA returns a plain object whose `n` is a hex string, not a forge
// BigInteger — so there's no .bitLength() on it to call. Round-tripping through
// PEM is both correct and the point: it's the exact path the actor endpoint
// uses (server/routes/social.ts), so "readable here" means "publishable there".
function bitsOf(magicKey: string): number | null {
  if (!magicKey) return null;

  try {
    const pem = forge.pki.publicKeyToPem(magic.magicToRSA(magicKey));
    return forge.pki.publicKeyFromPem(pem).n.bitLength();
  } catch {
    return null;
  }
}

const args = process.argv.slice(2);
console.log(`database: ${describeDatabase(process.env.DATABASE_URL)}\n`);

const users = await prisma.user.findMany({ select: { id: true, username: true, magicKey: true } });
const described = users.map((user) => ({ ...user, bits: bitsOf(user.magicKey) }));

if (!args.length || args.includes('--list')) {
  for (const { username, bits } of described) {
    const state = bits === null ? 'unreadable' : bits < 2048 ? `${bits} bits — WEAK` : `${bits} bits`;
    console.log(`${username.padEnd(24)} ${state}`);
  }
  if (!args.length) console.log('\nPass a username, or --all-weak, to rotate. Nothing was changed.');
  process.exit(0);
}

const rotatingAllWeak = args.includes('--all-weak');
const targets = rotatingAllWeak
  ? described.filter((user) => user.bits === null || user.bits < 2048)
  : described.filter((user) => args.includes(user.username));

if (!targets.length) {
  // Nothing weak left is the goal state, not a failure. Naming a user who
  // isn't there is a real mistake, so only that one exits non-zero.
  if (rotatingAllWeak) {
    console.log('Every key is already 2048 bits or better. Nothing to rotate.');
    process.exit(0);
  }
  console.error(`No matching users. Run with --list to see what's there.`);
  process.exit(1);
}

for (const target of targets) {
  const { magicKey, privateKey } = generateMagicKey();
  await prisma.user.update({
    where: { id: target.id },
    data: { magicKey, privateKey: encryptSecret(privateKey) },
  });
  console.log(`rotated ${target.username} (was ${target.bits ?? 'unreadable'} bits, now 2048)`);
}

console.log(
  `\nDone. Peers that cached the old public key will fail to verify your messages until they refetch the actor document.`
);
