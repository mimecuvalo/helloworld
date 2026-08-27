import { describe, expect, it } from 'vitest';
import {
  addIntegrityProof,
  assertionKeyOf,
  canonicalizeJcs,
  generateEd25519Key,
  proofOf,
  publicKeyFromMultibase,
  publicKeyMultibaseOf,
  verifyIntegrityProof,
  withProofContext,
} from 'server/social/integrity-proof';

const signer = generateEd25519Key();

const activity = () => ({
  '@context': withProofContext('https://www.w3.org/ns/activitystreams'),
  type: 'Create',
  id: 'https://example.com/activities/1',
  actor: 'https://example.com/ap/alice',
  to: ['https://www.w3.org/ns/activitystreams#Public'],
  object: { id: 'https://example.com/notes/1', type: 'Note', content: 'héllo · ünicode' },
});

function sign(document = activity(), privateKeyPem = signer.privateKeyPem) {
  return addIntegrityProof(document, {
    verificationMethod: 'https://example.com/actor#ed25519-key',
    privateKeyPem,
  });
}

// A proof is only worth anything if it survives serialization — that's the whole
// point of putting it on the object instead of the request.
const overTheWire = (document: unknown) => JSON.parse(JSON.stringify(document));

describe('canonicalizeJcs', () => {
  it('sorts object keys by UTF-16 code unit, not alphabetically', () => {
    // 'A' (0x41) sorts before 'a' (0x61), and 'é' after both.
    expect(canonicalizeJcs({ é: 1, a: 2, A: 3, b: 4 })).toBe('{"A":3,"a":2,"b":4,"é":1}');
  });

  it('sorts nested objects too, and leaves array order alone', () => {
    expect(canonicalizeJcs({ z: [3, 1, { y: 1, x: 2 }] })).toBe('{"z":[3,1,{"x":2,"y":1}]}');
  });

  it('serializes numbers the way ECMAScript does, which is what RFC 8785 requires', () => {
    expect(canonicalizeJcs({ big: 1e21, negZero: -0, frac: 0.1, int: 5 })).toBe(
      '{"big":1e+21,"frac":0.1,"int":5,"negZero":0}'
    );
  });

  it('drops undefined values but keeps undefined array holes as null', () => {
    expect(canonicalizeJcs({ a: undefined, b: 1 })).toBe('{"b":1}');
    expect(canonicalizeJcs([1, undefined, 2])).toBe('[1,null,2]');
  });

  it('refuses a non-finite number rather than silently emitting null', () => {
    expect(() => canonicalizeJcs({ n: NaN })).toThrow();
    expect(() => canonicalizeJcs({ n: Infinity })).toThrow();
  });
});

describe('Multikey encoding', () => {
  it('emits an Ed25519 multikey, which always renders with the z6Mk prefix', () => {
    expect(signer.publicKeyMultibase).toMatch(/^z6Mk/);
  });

  it('derives the same public multikey from the private key', () => {
    expect(publicKeyMultibaseOf(signer.privateKeyPem)).toBe(signer.publicKeyMultibase);
  });

  it('round-trips back to a usable public key', () => {
    const key = publicKeyFromMultibase(signer.publicKeyMultibase);

    expect(key.asymmetricKeyType).toBe('ed25519');
  });

  it('rejects a multibase that is not base58btc', () => {
    expect(() => publicKeyFromMultibase('mAQID')).toThrow(/base58btc/);
  });

  it('rejects a well-formed multikey on another curve', () => {
    // z6Dn… is X25519: valid base58btc, valid multicodec, wrong algorithm.
    expect(() => publicKeyFromMultibase('z6LSbysY2xFMRpGMhb7tFTLMpeuPRaqaWM1yECx2AtzE3KCc')).toThrow(/Ed25519/);
  });
});

describe('withProofContext', () => {
  it('appends the data integrity terms to a bare string context', () => {
    expect(withProofContext('https://www.w3.org/ns/activitystreams')).toEqual([
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/data-integrity/v1',
      'https://w3id.org/security/multikey/v1',
    ]);
  });

  it('does not duplicate terms that are already there', () => {
    expect(withProofContext(withProofContext('https://www.w3.org/ns/activitystreams'))).toEqual(
      withProofContext('https://www.w3.org/ns/activitystreams')
    );
  });
});

describe('addIntegrityProof', () => {
  it('attaches a FEP-8b32 proof naming the eddsa-jcs-2022 cryptosuite', () => {
    expect(sign().proof).toMatchObject({
      type: 'DataIntegrityProof',
      cryptosuite: 'eddsa-jcs-2022',
      proofPurpose: 'assertionMethod',
      verificationMethod: 'https://example.com/actor#ed25519-key',
    });
  });

  it('signs with a base58btc proofValue', () => {
    expect(sign().proof.proofValue).toMatch(/^z/);
  });

  it('leaves the document it signs otherwise untouched', () => {
    const { proof: _proof, ...rest } = sign();

    expect(rest).toEqual(activity());
  });
});

describe('verifyIntegrityProof', () => {
  it('verifies a proof it just made', () => {
    expect(verifyIntegrityProof(sign(), signer.publicKeyMultibase)).toBe(true);
  });

  it('still verifies after a JSON round trip, which is the point of it', () => {
    expect(verifyIntegrityProof(overTheWire(sign()), signer.publicKeyMultibase)).toBe(true);
  });

  it('does not care what order the keys arrive in', () => {
    // The whole reason for canonicalizing: a peer is free to re-serialize.
    const reordered = overTheWire(Object.fromEntries(Object.entries(sign()).reverse()));

    expect(verifyIntegrityProof(reordered, signer.publicKeyMultibase)).toBe(true);
  });

  it('catches a forwarder that edited the content', () => {
    const tampered = overTheWire(sign());
    tampered.object.content = 'something else entirely';

    expect(verifyIntegrityProof(tampered, signer.publicKeyMultibase)).toBe(false);
  });

  it('catches a swapped actor', () => {
    const tampered = overTheWire(sign());
    tampered.actor = 'https://attacker.example/users/eve';

    expect(verifyIntegrityProof(tampered, signer.publicKeyMultibase)).toBe(false);
  });

  it('catches an added field', () => {
    const tampered = overTheWire(sign());
    tampered.cc = ['https://attacker.example/users/eve'];

    expect(verifyIntegrityProof(tampered, signer.publicKeyMultibase)).toBe(false);
  });

  it('catches a changed @context, which the proof config binds', () => {
    const tampered = overTheWire(sign());
    tampered['@context'] = ['https://www.w3.org/ns/activitystreams'];

    expect(verifyIntegrityProof(tampered, signer.publicKeyMultibase)).toBe(false);
  });

  it('rejects a proof made by a different key', () => {
    expect(verifyIntegrityProof(sign(), generateEd25519Key().publicKeyMultibase)).toBe(false);
  });

  it('rejects a proof made for another purpose', () => {
    const tampered = overTheWire(sign());
    tampered.proof.proofPurpose = 'authentication';

    expect(verifyIntegrityProof(tampered, signer.publicKeyMultibase)).toBe(false);
  });

  it('rejects a cryptosuite we do not implement', () => {
    const tampered = overTheWire(sign());
    tampered.proof.cryptosuite = 'rsa-sha256-jcs-2022';

    expect(verifyIntegrityProof(tampered, signer.publicKeyMultibase)).toBe(false);
  });

  it('rejects a document with no proof at all', () => {
    expect(verifyIntegrityProof(activity(), signer.publicKeyMultibase)).toBe(false);
  });

  it('returns false rather than throwing on a garbage key', () => {
    expect(verifyIntegrityProof(sign(), 'not-a-multikey')).toBe(false);
  });

  it('re-signing replaces the old proof instead of hashing it in', () => {
    const resigned = sign(sign());

    expect(verifyIntegrityProof(resigned, signer.publicKeyMultibase)).toBe(true);
    expect(Array.isArray(resigned.proof)).toBe(false);
  });
});

describe('proofOf', () => {
  it('picks the DataIntegrityProof out of an array of proofs', () => {
    const signed = sign();
    const multi = { ...signed, proof: [{ type: 'RsaSignature2017' }, signed.proof] };

    expect(proofOf(multi)?.proofValue).toBe(signed.proof.proofValue);
  });

  it('ignores a proof with no proofValue', () => {
    expect(proofOf({ proof: { type: 'DataIntegrityProof', verificationMethod: 'k' } })).toBeNull();
  });

  it('ignores a legacy RsaSignature2017, which needs JSON-LD normalization we do not do', () => {
    expect(proofOf({ signature: { type: 'RsaSignature2017' }, proof: { type: 'RsaSignature2017' } })).toBeNull();
  });
});

describe('assertionKeyOf', () => {
  const key = { id: 'https://remote.example/users/bob#ed25519-key', publicKeyMultibase: signer.publicKeyMultibase };

  it('reads an inline Multikey out of an actor document', () => {
    expect(assertionKeyOf({ assertionMethod: [{ type: 'Multikey', ...key }] })).toEqual(key);
  });

  it('accepts a single object as well as an array', () => {
    expect(assertionKeyOf({ assertionMethod: { type: 'Multikey', ...key } })).toEqual(key);
  });

  it('skips bare id references, which would need another fetch to resolve', () => {
    expect(assertionKeyOf({ assertionMethod: ['https://remote.example/users/bob#ed25519-key'] })).toBeNull();
  });

  it('skips a key on a curve this cryptosuite cannot use', () => {
    expect(
      assertionKeyOf({
        assertionMethod: [
          { type: 'Multikey', id: 'p256', publicKeyMultibase: 'zDnaerDaTF5BXEavCrfRZEk316dpbLsfPDZ3WJ5hRTPFU2169' },
          { type: 'Multikey', ...key },
        ],
      })
    ).toEqual(key);
  });

  it('returns null when the actor publishes no assertion method', () => {
    expect(assertionKeyOf({ publicKey: { publicKeyPem: 'x' } })).toBeNull();
  });
});
