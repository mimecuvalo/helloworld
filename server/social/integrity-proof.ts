import crypto from 'crypto';
import { base58btc } from 'multiformats/bases/base58';

// FEP-8b32 object integrity proofs.
//
// An HTTP signature authenticates one hop: it covers the request line, the
// headers and (via Digest) the body of a single POST, and it dies the moment
// anyone relays that POST onward. That's fine for direct delivery and useless
// for the two cases the fediverse actually needs:
//
//   - inbox forwarding, where instance B passes an activity authored by C on to
//     us, signing the request with B's key;
//   - relays, which do the same thing at scale.
//
// Today we reject both, because the request signer isn't the actor. A proof
// attached to the *object* travels with it, so the author's signature survives
// any number of hops.
//
// The cryptosuite is `eddsa-jcs-2022`: Ed25519 over JCS-canonicalized JSON.
// It has to be Ed25519 — the suite names the curve — which is why this can't
// reuse the RSA federation key on the User row, and why users need a second
// keypair provisioned alongside it.
//
// Deliberately *not* RSA Linked Data Signatures (the RsaSignature2017 that
// Mastodon has emitted since 2017): that scheme needs full JSON-LD
// normalization (URDNA2015), which means a JSON-LD processor and a pile of
// remote context documents. FEP-8b32 exists precisely to replace it with
// something you can implement against a JSON serializer, and it's where the
// ecosystem is heading. We verify proofs on the way in and attach them on the
// way out; peers that only speak RsaSignature2017 keep working over plain HTTP
// signatures, which is what they use for direct delivery anyway.

const CRYPTOSUITE = 'eddsa-jcs-2022';
const PROOF_TYPE = 'DataIntegrityProof';
const PROOF_PURPOSE = 'assertionMethod';

// multicodec `ed25519-pub`, the two bytes that make a Multikey render as z6Mk…
const ED25519_MULTICODEC = Buffer.from([0xed, 0x01]);
// The fixed DER header on a 32-byte Ed25519 SPKI key. Node will only import a
// public key as structured DER, and the raw bytes are all a Multikey carries.
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const ED25519_RAW_LENGTH = 32;

export const DATA_INTEGRITY_CONTEXT = 'https://w3id.org/security/data-integrity/v1';
export const MULTIKEY_CONTEXT = 'https://w3id.org/security/multikey/v1';

export type IntegrityProof = {
  type: string;
  cryptosuite: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue: string;
};

// JCS, RFC 8785.
//
// Two rules do all the work: object keys sort by their UTF-16 code units, and
// primitives serialize exactly as ECMAScript's JSON.stringify already does
// (RFC 8785 defines its number format by reference to ECMAScript, so
// JSON.stringify *is* the spec here — no hand-rolled float formatting).
// `<` on JS strings compares UTF-16 code units, so the default sort is the
// required one.
export function canonicalizeJcs(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    // NaN and ±Infinity have no JSON form; JSON.stringify would emit `null` and
    // silently change what got signed.
    if (!Number.isFinite(value)) throw new Error('Cannot canonicalize a non-finite number.');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    // A hole or an explicit undefined is `null` in JSON; match that rather than
    // dropping the element and shifting every index after it.
    return `[${value.map((item) => canonicalizeJcs(item === undefined ? null : item)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalizeJcs(item)}`).join(',')}}`;
  }
  throw new Error(`Cannot canonicalize a ${typeof value}.`);
}

// What the peer will actually receive. Signing the in-memory object instead
// would sign Dates and undefined-valued keys that never reach the wire, so the
// proof would fail to verify against the bytes we sent.
function asWireJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function sha256(input: string): Buffer {
  return crypto.createHash('sha256').update(input, 'utf8').digest();
}

// hashData = SHA-256(proof config) ‖ SHA-256(document), proof config first.
function hashData(document: unknown, proofConfig: unknown): Buffer {
  return Buffer.concat([sha256(canonicalizeJcs(proofConfig)), sha256(canonicalizeJcs(document))]);
}

// The proof config is hashed with the document's own `@context` spliced in — it
// binds the proof to the vocabulary the document was written against — but the
// embedded proof omits it, which is what deployed fediverse implementations
// emit and expect. Both sides of that asymmetry live here so they can't drift.
function proofConfigFor(document: Record<string, unknown>, proof: Omit<IntegrityProof, 'proofValue'>) {
  return { '@context': document['@context'], ...proof };
}

export function generateEd25519Key(): { privateKeyPem: string; publicKeyMultibase: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return {
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicKeyMultibase: multikeyOf(publicKey),
  };
}

// base58btc checks `instanceof Uint8Array`, and a Node Buffer fails that under
// jsdom — it's a Uint8Array from the *other* realm. Copying through
// Uint8Array.from here uses the same binding multiformats sees. (Same trap as
// the hex round-trip in atproto-identity.ts.)
function toBytes(buffer: Uint8Array): Uint8Array {
  return Uint8Array.from(buffer);
}

function multikeyOf(publicKey: crypto.KeyObject): string {
  const der = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
  const raw = der.subarray(der.length - ED25519_RAW_LENGTH);
  return base58btc.encode(toBytes(Buffer.concat([ED25519_MULTICODEC, raw])));
}

export function publicKeyMultibaseOf(privateKeyPem: string): string {
  return multikeyOf(crypto.createPublicKey(privateKeyPem));
}

export function publicKeyFromMultibase(publicKeyMultibase: string): crypto.KeyObject {
  // base58btc is the only multibase the Multikey spec allows for these, and its
  // prefix is `z`. Rejecting anything else keeps a base64 key from decoding to
  // plausible-looking garbage.
  if (!publicKeyMultibase.startsWith('z')) throw new Error('Multikey must be base58btc-encoded (a leading `z`).');

  const bytes = Buffer.from(base58btc.decode(publicKeyMultibase));
  if (
    bytes.length !== ED25519_MULTICODEC.length + ED25519_RAW_LENGTH ||
    !bytes.subarray(0, 2).equals(ED25519_MULTICODEC)
  ) {
    throw new Error('Not an Ed25519 Multikey.');
  }

  return crypto.createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, bytes.subarray(ED25519_MULTICODEC.length)]),
    format: 'der',
    type: 'spki',
  });
}

// Adds the `@context` terms a proof needs, without disturbing what's there.
// Peers that don't resolve contexts ignore the addition; ones that do would
// otherwise drop `proof` as an undefined term.
export function withProofContext(context: unknown): unknown[] {
  const existing = Array.isArray(context) ? context : context ? [context] : [];
  const added = [DATA_INTEGRITY_CONTEXT, MULTIKEY_CONTEXT].filter((term) => !existing.includes(term));
  return [...existing, ...added];
}

export function addIntegrityProof<T extends Record<string, unknown>>(
  document: T,
  options: { verificationMethod: string; privateKeyPem: string; created?: string }
): T & { proof: IntegrityProof } {
  // Re-signing a document that already carries a proof would hash the old proof
  // into the new one; the input to signing is always the unsecured document.
  const { proof: _existing, ...unsecured } = document as Record<string, unknown>;
  const wire = asWireJson(unsecured) as Record<string, unknown>;

  const proof = {
    type: PROOF_TYPE,
    cryptosuite: CRYPTOSUITE,
    created: options.created || new Date().toISOString(),
    verificationMethod: options.verificationMethod,
    proofPurpose: PROOF_PURPOSE,
  };

  const signature = crypto.sign(
    null,
    hashData(wire, proofConfigFor(wire, proof)),
    crypto.createPrivateKey(options.privateKeyPem)
  );

  return { ...(unsecured as T), proof: { ...proof, proofValue: base58btc.encode(toBytes(signature)) } };
}

export function proofOf(document: unknown): IntegrityProof | null {
  const proof = (document as { proof?: unknown } | null)?.proof;
  // A document may carry several proofs as an array; we only understand one.
  const candidate = (Array.isArray(proof) ? proof : [proof]).find(
    (entry) => (entry as IntegrityProof | undefined)?.type === PROOF_TYPE
  ) as IntegrityProof | undefined;

  return candidate?.proofValue && candidate.verificationMethod ? candidate : null;
}

// Verifies the proof on a document against one published Multikey.
//
// This says the holder of that key signed these bytes — nothing more. Whether
// the key is allowed to speak for the activity's actor is the caller's
// question, and the answer is not "it verified".
export function verifyIntegrityProof(document: unknown, publicKeyMultibase: string): boolean {
  try {
    const proof = proofOf(document);
    if (!proof) return false;
    if (proof.cryptosuite !== CRYPTOSUITE) return false;
    // A key authorized to assert facts is not thereby authorized to authenticate
    // or delegate; a proof made for another purpose must not count here.
    if (proof.proofPurpose !== PROOF_PURPOSE) return false;

    const { proof: _proof, ...unsecured } = document as Record<string, unknown>;
    const wire = asWireJson(unsecured) as Record<string, unknown>;
    const { proofValue: _value, ...config } = proof;

    return crypto.verify(
      null,
      hashData(wire, proofConfigFor(wire, config)),
      publicKeyFromMultibase(publicKeyMultibase),
      Buffer.from(base58btc.decode(proof.proofValue))
    );
  } catch {
    // A malformed key, an unparseable proofValue, a document that won't
    // canonicalize — all of it means the same thing to the caller.
    return false;
  }
}

// Pulls the Ed25519 Multikey out of an actor document's assertionMethod.
//
// `assertionMethod` may be a single object, an array, or bare id strings
// referring to keys defined elsewhere in the document; only an inline Multikey
// is usable without another fetch.
export function assertionKeyOf(actorJson: unknown): { id: string; publicKeyMultibase: string } | null {
  const methods = (actorJson as { assertionMethod?: unknown })?.assertionMethod;
  if (!methods) return null;

  for (const method of Array.isArray(methods) ? methods : [methods]) {
    const entry = method as { id?: string; type?: string; publicKeyMultibase?: string } | null;
    if (!entry?.publicKeyMultibase) continue;
    if (entry.type && entry.type !== 'Multikey') continue;
    try {
      publicKeyFromMultibase(entry.publicKeyMultibase);
    } catch {
      // Some implementations publish a P-256 or secp256k1 Multikey here; it's a
      // valid key, just not one this cryptosuite can use.
      continue;
    }
    return { id: entry.id || '', publicKeyMultibase: entry.publicKeyMultibase };
  }

  return null;
}
