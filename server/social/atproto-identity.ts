import { Secp256k1Keypair, formatMultikey } from '@atproto/crypto';
import type { User } from '../../generated/prisma/client';
import { buildUrl } from '../../lib/url-factory';
import { fetchJSON, fetchText } from '../crawler';
import { decryptSecret } from '../secrets';

// AT Protocol identity for a local user.
//
// The DID is did:web, not did:plc — we're not registering with the PLC
// directory, so identity is anchored to the domain the site already controls.
// A user with their own `hostname` gets `did:web:<hostname>`; everyone on the
// shared host gets the path form, `did:web:<host>:<username>`, which resolves
// at /<username>/did.json.
//
// Read the scope note in atproto.ts before assuming this federates: the XRPC
// surface is read-only and relays do not index it.

export const PUBLIC_BSKY_PDS = 'https://bsky.social';
const PLC_DIRECTORY = 'https://plc.directory';

// A did:web id can't contain a port or a scheme, and the colon is the path
// separator — so localhost:3000 has no valid did:web form.
export function canHaveDid(host: string): boolean {
  return !!host && !host.includes(':');
}

export function didForUser(host: string, user: Pick<User, 'username' | 'hostname'>): string {
  const ownDomain = user.hostname && user.hostname === host;
  return ownDomain ? `did:web:${host}` : `did:web:${host}:${user.username}`;
}

// Where the DID document for that id has to be served from, per did:web.
export function didDocumentPathFor(user: Pick<User, 'username' | 'hostname'>, host: string): string {
  return user.hostname && user.hostname === host ? '/.well-known/did.json' : `/${user.username}/did.json`;
}

// Hex in, hex out. @atproto/crypto's importer takes a hex string directly,
// which also sidesteps a realm mismatch: a Node Buffer fails the library's
// `instanceof Uint8Array` check under jsdom.
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function generateSigningKey(): Promise<{ privateKeyHex: string; publicKeyMultibase: string }> {
  const keypair = await Secp256k1Keypair.create({ exportable: true });
  return {
    privateKeyHex: toHex(await keypair.export()),
    publicKeyMultibase: formatMultikey(keypair.jwtAlg, keypair.publicKeyBytes()),
  };
}

export async function publicKeyMultibaseOf(privateKeyHex: string): Promise<string> {
  const keypair = await Secp256k1Keypair.import(privateKeyHex);
  return formatMultikey(keypair.jwtAlg, keypair.publicKeyBytes());
}

export async function buildDidDocument(host: string, user: User): Promise<Record<string, unknown> | null> {
  if (!user.atprotoSigningKey) return null;

  const did = didForUser(host, user);
  const handle = user.hostname === host ? host : `${user.username}.${host}`;

  return {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/multikey/v1'],
    id: did,
    alsoKnownAs: [`at://${handle}`],
    verificationMethod: [
      {
        id: `${did}#atproto`,
        type: 'Multikey',
        controller: did,
        publicKeyMultibase: await publicKeyMultibaseOf(decryptSecret(user.atprotoSigningKey)),
      },
    ],
    service: [
      {
        id: '#atproto_pds',
        type: 'AtprotoPersonalDataServer',
        serviceEndpoint: buildUrl({ host, pathname: '' }),
      },
    ],
  };
}

// --- resolving *remote* identities -----------------------------------------

const HANDLE_REGEXP = /^@?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+)$/i;

// Recognizes the ways someone might name a Bluesky account, so following one
// doesn't go down the Atom-discovery path.
export function parseAtprotoIdentifier(input: string): string | null {
  const value = (input || '').trim();
  if (!value) return null;

  if (value.startsWith('did:')) return value;
  if (value.startsWith('at://')) return value.slice('at://'.length).split('/')[0];

  const profileMatch = value.match(/^https?:\/\/(?:www\.)?bsky\.app\/profile\/([^/?#]+)/i);
  if (profileMatch) return decodeURIComponent(profileMatch[1]);

  // A bare handle, but not a URL: `alice.bsky.social`, `@alice.example.com`.
  if (!value.includes('/') && HANDLE_REGEXP.test(value)) return value.replace(/^@/, '');

  return null;
}

export async function resolveHandleToDid(handle: string): Promise<string | null> {
  if (handle.startsWith('did:')) return handle;

  // The two mechanisms the spec defines, in the order it prefers.
  try {
    const text = (await fetchText(`https://${handle}/.well-known/atproto-did`)).trim();
    if (text.startsWith('did:')) return text;
  } catch {
    /* fall through to the appview */
  }

  try {
    const json = (await fetchJSON(
      `${PUBLIC_BSKY_PDS.replace('bsky.social', 'public.api.bsky.app')}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
      { Accept: 'application/json' }
    )) as unknown as { did?: string };
    return json?.did || null;
  } catch {
    return null;
  }
}

export async function resolveDidDocument(did: string): Promise<Record<string, unknown> | null> {
  try {
    if (did.startsWith('did:plc:')) {
      return (await fetchJSON(`${PLC_DIRECTORY}/${encodeURIComponent(did)}`, {
        Accept: 'application/json',
      })) as unknown as Record<string, unknown>;
    }
    if (did.startsWith('did:web:')) {
      // did:web:example.com:alice -> https://example.com/alice/did.json
      const [domain, ...path] = did.slice('did:web:'.length).split(':');
      const suffix = path.length ? `/${path.map(decodeURIComponent).join('/')}/did.json` : '/.well-known/did.json';
      return (await fetchJSON(`https://${decodeURIComponent(domain)}${suffix}`, {
        Accept: 'application/json',
      })) as unknown as Record<string, unknown>;
    }
  } catch {
    /* unresolvable */
  }
  return null;
}

type DidService = { id?: string; type?: string; serviceEndpoint?: string };

export function pdsEndpointOf(didDocument: Record<string, unknown> | null): string | null {
  const services = (didDocument?.['service'] as DidService[] | undefined) || [];
  const pds = services.find(
    (service) => service.type === 'AtprotoPersonalDataServer' || service.id?.endsWith('atproto_pds')
  );
  return pds?.serviceEndpoint || null;
}

export function handleOf(didDocument: Record<string, unknown> | null): string | null {
  const aliases = (didDocument?.['alsoKnownAs'] as string[] | undefined) || [];
  const handle = aliases.find((alias) => alias.startsWith('at://'));
  return handle ? handle.slice('at://'.length) : null;
}

// Everything needed to follow a remote atproto account.
export async function resolveAtprotoIdentity(
  input: string
): Promise<{ did: string; handle: string; pdsUrl: string } | null> {
  const identifier = parseAtprotoIdentifier(input);
  if (!identifier) return null;

  const did = await resolveHandleToDid(identifier);
  if (!did) return null;

  const didDocument = await resolveDidDocument(did);
  return {
    did,
    handle: handleOf(didDocument) || (identifier.startsWith('did:') ? did : identifier),
    pdsUrl: pdsEndpointOf(didDocument) || PUBLIC_BSKY_PDS,
  };
}
