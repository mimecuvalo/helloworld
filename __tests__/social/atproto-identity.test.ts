import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDidDocument,
  canHaveDid,
  didDocumentPathFor,
  didForUser,
  generateSigningKey,
  handleOf,
  parseAtprotoIdentifier,
  pdsEndpointOf,
  publicKeyMultibaseOf,
  resolveAtprotoIdentity,
  resolveDidDocument,
  resolveHandleToDid,
} from 'server/social/atproto-identity';
import { HOST, user } from './fixtures';

let fetchMock: ReturnType<typeof vi.fn>;

// A real key is cheap enough here and keeps the multibase assertions honest.
let signingKey: string;
beforeEach(async () => {
  vi.clearAllMocks();
  fetchMock = vi.fn().mockRejectedValue(new Error('no route'));
  vi.stubGlobal('fetch', fetchMock);
  if (!signingKey) signingKey = (await generateSigningKey()).privateKeyHex;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

describe('parseAtprotoIdentifier', () => {
  it.each([
    ['alice.bsky.social', 'alice.bsky.social'],
    ['@alice.bsky.social', 'alice.bsky.social'],
    ['did:plc:abc123', 'did:plc:abc123'],
    ['at://alice.bsky.social/app.bsky.feed.post/1', 'alice.bsky.social'],
    ['https://bsky.app/profile/alice.bsky.social', 'alice.bsky.social'],
    ['https://bsky.app/profile/did:plc:abc/post/xyz', 'did:plc:abc'],
  ])('recognizes %s', (input, expected) => {
    expect(parseAtprotoIdentifier(input)).toBe(expected);
  });

  it.each(['', 'https://example.com/alice', 'not a handle', 'alice'])(
    'does not claim %s, which belongs to the Atom path',
    (input) => {
      expect(parseAtprotoIdentifier(input)).toBeNull();
    }
  );
});

describe('didForUser', () => {
  it('anchors a user with their own domain to the bare domain', () => {
    expect(didForUser('alice.com', user({ hostname: 'alice.com' }))).toBe('did:web:alice.com');
    expect(didDocumentPathFor(user({ hostname: 'alice.com' }), 'alice.com')).toBe('/.well-known/did.json');
  });

  it('uses the path form for a user on the shared host', () => {
    expect(didForUser(HOST, user())).toBe(`did:web:${HOST}:alice`);
    expect(didDocumentPathFor(user(), HOST)).toBe('/alice/did.json');
  });

  it('refuses a host with a port, which has no valid did:web form', () => {
    expect(canHaveDid('localhost:3000')).toBe(false);
    expect(canHaveDid(HOST)).toBe(true);
  });
});

describe('buildDidDocument', () => {
  it('publishes a Multikey verification method and the PDS service', async () => {
    const document = await buildDidDocument(HOST, user({ atprotoSigningKey: signingKey }));

    expect(document).toMatchObject({
      id: `did:web:${HOST}:alice`,
      alsoKnownAs: [`at://alice.${HOST}`],
      service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: `https://${HOST}` }],
    });
    const method = (document!.verificationMethod as { id: string; type: string; publicKeyMultibase: string }[])[0];
    expect(method.type).toBe('Multikey');
    expect(method.id).toBe(`did:web:${HOST}:alice#atproto`);
    expect(method.publicKeyMultibase).toBe(await publicKeyMultibaseOf(signingKey));
    // secp256k1 multikeys are z-prefixed base58btc.
    expect(method.publicKeyMultibase.startsWith('zQ3s')).toBe(true);
  });

  it('returns nothing for a user with no signing key yet', async () => {
    await expect(buildDidDocument(HOST, user({ atprotoSigningKey: null }))).resolves.toBeNull();
  });
});

describe('resolveHandleToDid', () => {
  it('prefers the domain .well-known, which needs no third party', async () => {
    fetchMock.mockResolvedValue(new Response('did:web:alice.com', { status: 200 }));

    await expect(resolveHandleToDid('alice.com')).resolves.toBe('did:web:alice.com');
    expect(fetchMock.mock.calls[0][0]).toBe('https://alice.com/.well-known/atproto-did');
  });

  it('falls back to the appview when the domain does not serve one', async () => {
    fetchMock.mockRejectedValueOnce(new Error('404')).mockResolvedValueOnce(json({ did: 'did:plc:abc' }));

    await expect(resolveHandleToDid('alice.bsky.social')).resolves.toBe('did:plc:abc');
    expect(fetchMock.mock.calls[1][0]).toContain('com.atproto.identity.resolveHandle');
  });

  it('passes a DID straight through', async () => {
    await expect(resolveHandleToDid('did:plc:abc')).resolves.toBe('did:plc:abc');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null when nothing resolves', async () => {
    await expect(resolveHandleToDid('nope.example')).resolves.toBeNull();
  });
});

describe('resolveDidDocument', () => {
  it('reads a did:plc from the PLC directory', async () => {
    fetchMock.mockResolvedValue(json({ id: 'did:plc:abc' }));

    await expect(resolveDidDocument('did:plc:abc')).resolves.toMatchObject({ id: 'did:plc:abc' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://plc.directory/did%3Aplc%3Aabc');
  });

  it('maps a path-form did:web back to its document url', async () => {
    fetchMock.mockResolvedValue(json({ id: 'x' }));

    await resolveDidDocument('did:web:example.com:alice');

    expect(fetchMock.mock.calls[0][0]).toBe('https://example.com/alice/did.json');
  });

  it('maps a bare did:web to the well-known path', async () => {
    fetchMock.mockResolvedValue(json({ id: 'x' }));

    await resolveDidDocument('did:web:example.com');

    expect(fetchMock.mock.calls[0][0]).toBe('https://example.com/.well-known/did.json');
  });
});

describe('reading a did document', () => {
  const document = {
    alsoKnownAs: ['at://alice.bsky.social'],
    service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: 'https://pds.example' }],
  };

  it('finds the PDS endpoint and handle', () => {
    expect(pdsEndpointOf(document)).toBe('https://pds.example');
    expect(handleOf(document)).toBe('alice.bsky.social');
  });

  it('tolerates a document with neither', () => {
    expect(pdsEndpointOf({})).toBeNull();
    expect(handleOf({})).toBeNull();
    expect(pdsEndpointOf(null)).toBeNull();
  });
});

describe('resolveAtprotoIdentity', () => {
  it('resolves a handle all the way to its PDS', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('404'))
      .mockResolvedValueOnce(json({ did: 'did:plc:abc' }))
      .mockResolvedValueOnce(
        json({
          alsoKnownAs: ['at://alice.bsky.social'],
          service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: 'https://pds.example' }],
        })
      );

    await expect(resolveAtprotoIdentity('@alice.bsky.social')).resolves.toEqual({
      did: 'did:plc:abc',
      handle: 'alice.bsky.social',
      pdsUrl: 'https://pds.example',
    });
  });

  it('defaults to the public PDS when the document names none', async () => {
    fetchMock.mockRejectedValueOnce(new Error('404')).mockResolvedValueOnce(json({ did: 'did:plc:abc' }));

    await expect(resolveAtprotoIdentity('alice.bsky.social')).resolves.toMatchObject({
      pdsUrl: 'https://bsky.social',
    });
  });

  it('returns null for something that is not an atproto identity', async () => {
    await expect(resolveAtprotoIdentity('https://blog.example/alice')).resolves.toBeNull();
  });
});
