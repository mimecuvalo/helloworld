import crypto from 'crypto';
import { NODE_ENV, SECRETS_KEY } from './config';

// Encryption at rest for the secrets on the User row: the RSA private key that
// signs federation messages, the AT Protocol signing key, and the Bluesky app
// password + refresh token.
//
// AES-256-GCM, so a tampered ciphertext fails to decrypt rather than yielding
// garbage. Stored as `enc:v1:<iv>:<tag>:<ciphertext>`, all base64 — the version
// tag leaves room to rotate the scheme, and the prefix is what tells an
// encrypted value apart from a legacy plaintext one.
//
// This protects a database dump, a stray backup, a read-replica, or log output
// that captured a row. It does NOT protect against an attacker who already has
// the running app's environment — SECRETS_KEY lives there.

const PREFIX = 'enc:v1:';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard
const KEY_LENGTH = 32; // AES-256

let cachedKey: Buffer | null | undefined;

// Accepts 64 hex chars or 32 bytes of base64, so operators can generate one
// with either `openssl rand -hex 32` or `openssl rand -base64 32`.
function secretsKey(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey;

  const raw = (SECRETS_KEY || '').trim();
  if (!raw) {
    cachedKey = null;
    return cachedKey;
  }

  const decoded = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (decoded.length !== KEY_LENGTH) {
    throw new Error(
      `SECRETS_KEY must be ${KEY_LENGTH} bytes (64 hex chars, or base64) — got ${decoded.length}. Generate one with: openssl rand -hex 32`
    );
  }

  cachedKey = decoded;
  return cachedKey;
}

export function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith(PREFIX);
}

export function encryptSecret(plaintext: string): string;
export function encryptSecret(plaintext: null | undefined): null;
export function encryptSecret(plaintext: string | null | undefined): string | null;
export function encryptSecret(plaintext: string | null | undefined): string | null {
  if (plaintext === null || plaintext === undefined || plaintext === '') return null;
  // Never double-encrypt: callers may pass a value that came straight from the db.
  if (isEncrypted(plaintext)) return plaintext;

  const key = secretsKey();
  if (!key) {
    // Refusing to write a secret in the clear is the whole point; dev without a
    // key still works, but a real deployment has to opt in deliberately.
    if (NODE_ENV === 'production') {
      throw new Error(
        'SECRETS_KEY is not set, so a secret would be written to the database in plaintext. Generate one with `openssl rand -hex 32` and set it in the environment.'
      );
    }
    return plaintext;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decryptSecret(stored: string | null | undefined): string {
  if (!stored) return '';
  // A value written before encryption was turned on is stored as-is. Reading it
  // has to keep working, or every existing user breaks on deploy.
  if (!isEncrypted(stored)) return stored;

  const key = secretsKey();
  if (!key) {
    throw new Error('SECRETS_KEY is not set, but this value is encrypted and cannot be read without it.');
  }

  const [ivB64, tagB64, ciphertextB64] = stored.slice(PREFIX.length).split(':');
  if (!ivB64 || !tagB64 || !ciphertextB64) {
    throw new Error('Malformed encrypted secret: expected enc:v1:<iv>:<tag>:<ciphertext>.');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()]).toString('utf8');
}

export function isSecretsKeyConfigured(): boolean {
  return !!secretsKey();
}

// Tests mutate the env between cases; the cache has to be droppable.
export function resetSecretsKeyCache(): void {
  cachedKey = undefined;
}
