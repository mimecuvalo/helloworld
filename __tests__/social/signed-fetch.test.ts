import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ getDefaultLocalUser: vi.fn() }));
vi.mock('server/social/db', () => db);
vi.mock('server/secrets', () => ({ decryptSecret: (value: string) => value }));

import { fetchActivityJson, resetSignerCache, signGetHeaders, signedFetch } from 'server/social/signed-fetch';
import { HOST, keys, user } from './fixtures';

// Outbound authorized fetch. Instances running Mastodon's secure mode 401 an
// unsigned GET, which is how actor lookups, parent-post fetches and key
// retrievals all failed silently against a large slice of the fediverse.

const TARGET = 'https://remote.example/users/bob';
const signer = () => user({ hostname: HOST, privateKey: keys().privateKeyPkcs1 });

let fetchMock: ReturnType<typeof vi.fn>;

function headersOf(call = 0): Record<string, string> {
  return fetchMock.mock.calls[call][1].headers;
}

function signatureParams(header: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const pair of header.split(',')) {
    const [key, ...rest] = pair.split('=');
    params[key.trim()] = rest.join('=').replace(/^"/, '').replace(/"$/, '');
  }
  return params;
}

beforeEach(() => {
  vi.clearAllMocks();
  resetSignerCache();
  fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"x"}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  db.getDefaultLocalUser.mockResolvedValue(signer());
});

describe('signGetHeaders', () => {
  it('signs (request-target) host date, which is what a GET has to offer', () => {
    const headers = signGetHeaders(`${TARGET}?x=1`, signer())!;
    const params = signatureParams(headers.Signature);

    expect(params.headers).toBe('(request-target) host date');
    expect(params.algorithm).toBe('rsa-sha256');

    const verifier = crypto.createVerify('sha256');
    verifier.update(
      ['(request-target): get /users/bob?x=1', 'host: remote.example', `date: ${headers.Date}`].join('\n')
    );
    verifier.end();
    expect(verifier.verify(keys().publicKey, params.signature, 'base64')).toBe(true);
  });

  it('names the key the actor document publishes, so the peer can resolve it', () => {
    const headers = signGetHeaders(TARGET, signer())!;

    expect(signatureParams(headers.Signature).keyId).toBe(`https://${HOST}/ap/alice#main-key`);
  });

  it('takes an explicit host over the users own, for a shared install', () => {
    const headers = signGetHeaders(TARGET, user({ privateKey: keys().privateKeyPkcs1 }), 'other.example')!;

    expect(signatureParams(headers.Signature).keyId).toBe('https://other.example/ap/alice#main-key');
  });

  // A second account on a shared install has no hostname of its own, and there
  // is nothing else on the row to build a public keyId from.
  it('declines to sign when there is no host to name the key under', () => {
    expect(signGetHeaders(TARGET, user({ privateKey: keys().privateKeyPkcs1 }))).toBeNull();
  });

  it('declines to sign when the user has no private key', () => {
    expect(signGetHeaders(TARGET, user({ hostname: HOST, privateKey: '' }))).toBeNull();
  });
});

describe('signedFetch', () => {
  it('asks for activity+json and identifies itself', async () => {
    await signedFetch(TARGET);

    expect(headersOf().Accept).toBe('application/activity+json');
    expect(headersOf()['User-Agent']).toContain('Hello-world');
  });

  it('signs as the sites default user when no signer is named', async () => {
    await signedFetch(TARGET);

    expect(signatureParams(headersOf().Signature).keyId).toBe(`https://${HOST}/ap/alice#main-key`);
  });

  it('reuses the resolved signer rather than re-reading it per fetch', async () => {
    await signedFetch(TARGET);
    await signedFetch(TARGET);

    expect(db.getDefaultLocalUser).toHaveBeenCalledTimes(1);
  });

  // Signing is an improvement, not a prerequisite: an unsigned GET still works
  // everywhere secure mode is off, which is most places.
  it('still fetches, unsigned, when there is no user to sign as', async () => {
    db.getDefaultLocalUser.mockResolvedValue(null);

    await signedFetch(TARGET);

    expect(headersOf().Signature).toBeUndefined();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('still fetches when the signer has no usable key', async () => {
    db.getDefaultLocalUser.mockResolvedValue(user({ hostname: HOST, privateKey: '' }));

    await signedFetch(TARGET);

    expect(headersOf().Signature).toBeUndefined();
  });

  it('carries on unsigned when the user row cannot be read at all', async () => {
    db.getDefaultLocalUser.mockRejectedValue(new Error('no database'));

    await expect(signedFetch(TARGET)).resolves.toBeDefined();
    expect(headersOf().Signature).toBeUndefined();
  });

  it('follows redirects, which is how instances point at their canonical actor', async () => {
    await signedFetch(TARGET);

    expect(fetchMock.mock.calls[0][1].redirect).toBe('follow');
  });
});

describe('fetchActivityJson', () => {
  it('returns the parsed document', async () => {
    await expect(fetchActivityJson(TARGET)).resolves.toEqual({ id: 'x' });
  });

  // Callers all sit behind a try/catch that treats a failure as "we don't know
  // who that is"; a 401 that resolved to undefined would sail straight past it.
  it('throws on a 401, which is exactly what secure mode returns', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }));

    await expect(fetchActivityJson(TARGET)).rejects.toThrow('401');
  });

  it('passes an explicit signer through, so a delivery signs as its own user', async () => {
    await fetchActivityJson(TARGET, { host: 'other.example', signer: signer() });

    expect(signatureParams(headersOf().Signature).keyId).toBe('https://other.example/ap/alice#main-key');
    expect(db.getDefaultLocalUser).not.toHaveBeenCalled();
  });

  it('sends nothing signed when the caller explicitly passes no signer', async () => {
    await fetchActivityJson(TARGET, { signer: null });

    expect(headersOf().Signature).toBeUndefined();
    expect(db.getDefaultLocalUser).not.toHaveBeenCalled();
  });
});
