import crypto from 'crypto';
import type { User } from '../../generated/prisma/client';
import { apUrl } from '../../lib/url-factory';
import { decryptSecret } from '../secrets';
import { getDefaultLocalUser } from './db';

// Outbound authorized fetch.
//
// Mastodon's `AUTHORIZED_FETCH` (secure mode) requires an HTTP signature on GET
// requests too, not just on inbox deliveries, and a lot of instances run it —
// including most of the ones with strict moderation. Every actor lookup, every
// parent-post fetch and every key retrieval used to go out with nothing but a
// user-agent, so against those instances they all came back 401 and the failure
// was silent: an actor that couldn't be resolved, a reply whose author couldn't
// be worked out, a proof that couldn't be verified.
//
// Signing is best-effort. An unsigned GET still works everywhere secure mode is
// off, which is the majority, so a site with no usable key degrades to exactly
// the behaviour it had before rather than losing federation entirely.

export const ACTIVITY_JSON = 'application/activity+json';
export const USER_AGENT = 'Hello-world (+https://github.com/mimecuvalo/helloworld)';

// Whoever signs a fetch that isn't on behalf of a particular user.
//
// Any local key authenticates the *instance* — the peer only needs to resolve
// the keyId and decide whether we're blocked — so the site's default user is as
// good a signer as any. Cached because discovery of one actor can trigger
// several fetches and none of them should re-read the user row.
let cachedSigner: { user: User | null; expiresAt: number } | null = null;
const SIGNER_TTL_MS = 60 * 1000;

export function resetSignerCache() {
  cachedSigner = null;
}

async function defaultSigner(): Promise<User | null> {
  if (cachedSigner && cachedSigner.expiresAt > Date.now()) return cachedSigner.user;
  let user: User | null = null;
  try {
    user = await getDefaultLocalUser('');
  } catch {
    // No database, or no users yet: fetch unsigned.
  }
  cachedSigner = { user, expiresAt: Date.now() + SIGNER_TTL_MS };
  return user;
}

// The host a signer's keyId lives on. `hostname` is the site this user owns; a
// second account on a shared install has none, and there is nothing else on the
// row to derive a public URL from, so those fall back to signing nothing.
function hostFor(signer: User, host?: string): string {
  return host || signer.hostname || '';
}

// Signs `(request-target) host date` — no digest, because a GET has no body.
// This is the draft-cavage shape Mastodon's secure mode expects.
export function signGetHeaders(url: string, signer: User, host?: string): Record<string, string> | null {
  const signerHost = hostFor(signer, host);
  if (!signerHost || !signer.privateKey) return null;

  let privateKey: string;
  try {
    privateKey = decryptSecret(signer.privateKey);
  } catch {
    // Unreadable SECRETS_KEY. Loud on the delivery path, where nothing can be
    // sent at all; here it just means falling back to an unsigned read.
    return null;
  }
  if (!privateKey) return null;

  const target = new URL(url);
  const date = new Date().toUTCString();
  const signingString = [
    `(request-target): get ${target.pathname}${target.search}`,
    `host: ${target.host}`,
    `date: ${date}`,
  ].join('\n');

  const signature = crypto.createSign('sha256').update(signingString).end().sign(privateKey).toString('base64');
  const keyId = `${apUrl(signerHost, signer.username)}#main-key`;

  return {
    Host: target.host,
    Date: date,
    Signature: `keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) host date",signature="${signature}"`,
  };
}

export async function signedFetch(
  url: string,
  options: { host?: string; signer?: User | null; accept?: string } = {}
): Promise<Response> {
  const signer = options.signer === undefined ? await defaultSigner() : options.signer;
  const headers: Record<string, string> = {
    Accept: options.accept || ACTIVITY_JSON,
    'User-Agent': USER_AGENT,
  };

  if (signer) Object.assign(headers, signGetHeaders(url, signer, options.host) || {});

  return await fetch(url, { headers, redirect: 'follow' });
}

// The signed counterpart of crawler.fetchJSON, for everything on the
// ActivityPub side. Throws on a non-2xx so callers keep their existing
// try/catch behaviour.
export async function fetchActivityJson(
  url: string,
  options: { host?: string; signer?: User | null } = {}
): Promise<unknown> {
  const response = await signedFetch(url, options);
  if (response.status >= 400) throw new Error(`${response.status} fetching ${url}`);
  return await response.json();
}
