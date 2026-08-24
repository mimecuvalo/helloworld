import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const config = vi.hoisted(() => ({ SECRETS_KEY: '', NODE_ENV: 'test' }));
vi.mock('server/config', () => config);

import {
  decryptSecret,
  encryptSecret,
  isEncrypted,
  isSecretsKeyConfigured,
  resetSecretsKeyCache,
} from 'server/secrets';

const KEY_HEX = crypto.randomBytes(32).toString('hex');

function withKey(key: string, nodeEnv = 'test') {
  config.SECRETS_KEY = key;
  config.NODE_ENV = nodeEnv;
  resetSecretsKeyCache();
}

beforeEach(() => withKey(KEY_HEX));
afterEach(() => withKey(''));

describe('round trip', () => {
  it('recovers exactly what went in', () => {
    const secret = 'hunter2-app-password';

    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it('handles a multi-line PEM private key', () => {
    const pem = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    }).privateKey;

    expect(decryptSecret(encryptSecret(pem))).toBe(pem);
  });

  it('handles unicode', () => {
    expect(decryptSecret(encryptSecret('pässwörd 🔐'))).toBe('pässwörd 🔐');
  });

  it('accepts a base64 key as readily as a hex one', () => {
    withKey(crypto.randomBytes(32).toString('base64'));

    expect(decryptSecret(encryptSecret('secret'))).toBe('secret');
  });
});

describe('ciphertext shape', () => {
  it('is tagged, versioned, and does not contain the plaintext', () => {
    const encrypted = encryptSecret('app-password');

    expect(encrypted?.startsWith('enc:v1:')).toBe(true);
    expect(encrypted).not.toContain('app-password');
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it('uses a fresh IV, so the same secret never encrypts identically', () => {
    expect(encryptSecret('same')).not.toBe(encryptSecret('same'));
  });

  it('never double-encrypts a value read back from the database', () => {
    const once = encryptSecret('secret');

    expect(encryptSecret(once)).toBe(once);
  });
});

describe('tamper detection', () => {
  it('refuses a modified ciphertext rather than returning garbage', () => {
    const [prefix, version, iv, tag, ciphertext] = encryptSecret('secret')!.split(':');
    const flipped = Buffer.from(ciphertext, 'base64');
    flipped[0] ^= 0xff;

    expect(() => decryptSecret([prefix, version, iv, tag, flipped.toString('base64')].join(':'))).toThrow();
  });

  it('refuses a value encrypted under a different key', () => {
    const encrypted = encryptSecret('secret');
    withKey(crypto.randomBytes(32).toString('hex'));

    expect(() => decryptSecret(encrypted)).toThrow();
  });

  it('rejects a malformed payload', () => {
    expect(() => decryptSecret('enc:v1:onlyonepart')).toThrow(/Malformed/);
  });
});

describe('legacy plaintext', () => {
  it('reads an unencrypted value straight through, so existing rows keep working', () => {
    expect(decryptSecret('RSA.plaintext-legacy-key')).toBe('RSA.plaintext-legacy-key');
    expect(isEncrypted('RSA.plaintext-legacy-key')).toBe(false);
  });

  it('treats empty and null as empty', () => {
    expect(decryptSecret(null)).toBe('');
    expect(decryptSecret(undefined)).toBe('');
    expect(decryptSecret('')).toBe('');
  });

  it('encrypts null-ish values to null rather than a ciphertext of ""', () => {
    expect(encryptSecret(null)).toBeNull();
    expect(encryptSecret('')).toBeNull();
  });
});

describe('without a key configured', () => {
  beforeEach(() => withKey(''));

  it('reports itself unconfigured', () => {
    expect(isSecretsKeyConfigured()).toBe(false);
  });

  it('passes plaintext through in development, so local dev still works', () => {
    expect(encryptSecret('secret')).toBe('secret');
  });

  it('refuses to write a secret in the clear in production', () => {
    withKey('', 'production');

    expect(() => encryptSecret('secret')).toThrow(/SECRETS_KEY is not set/);
  });

  it('cannot read an already-encrypted value', () => {
    withKey(KEY_HEX);
    const encrypted = encryptSecret('secret');
    withKey('');

    expect(() => decryptSecret(encrypted)).toThrow(/cannot be read without it/);
  });
});

describe('key validation', () => {
  it('rejects a key that is not 32 bytes', () => {
    withKey('abc123');

    expect(() => encryptSecret('secret')).toThrow(/must be 32 bytes/);
  });
});
