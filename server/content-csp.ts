import crypto from 'node:crypto';
import { getGlobalStartContext } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { buildContentSecurityPolicy } from 'lib/security';
import { S3_AWS_S3_BUCKET_NAME } from './config';

// Owner-authored content (Content.view / .code / .style) is rendered into the SSR
// markup verbatim via dangerouslySetInnerHTML, so the browser's parser runs any
// <script> it finds — but the strict CSP from start.ts blocks it. Rather than leak
// the request nonce into content (which would amount to 'unsafe-inline', and which
// CDN-cached HTML makes predictable anyway), we hash each inline script and add
// just those hashes to this response's script-src. The grant is then bound to the
// exact bytes the author saved: an injection elsewhere in the page inherits nothing.

// Deliberately a regex and not cheerio: the hash must cover the exact bytes the
// browser sees between the tags, and re-serializing a parsed DOM can change them.
// Every failure mode here is fail-closed — a missed script just doesn't execute.
const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const SRC_ATTR_RE = /\bsrc\s*=/i;
const TYPE_ATTR_RE = /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/i;

// Types the browser will actually execute. Anything else (application/ld+json,
// text/template, importmap, speculationrules) is data, not script.
const EXECUTABLE_TYPES = new Set([
  '',
  'module',
  'text/javascript',
  'application/javascript',
  'text/ecmascript',
  'application/ecmascript',
]);

export function inlineScriptHashes(...sources: (string | null | undefined)[]): string[] {
  const hashes = new Set<string>();

  for (const html of sources) {
    if (!html) continue;
    for (const [, attributes, body] of html.matchAll(SCRIPT_RE)) {
      // External scripts can't be covered by a source hash; they have to be
      // created by one of the inline scripts below ('strict-dynamic' allows it).
      if (SRC_ATTR_RE.test(attributes)) continue;
      if (!body?.trim()) continue;

      const typeMatch = attributes.match(TYPE_ATTR_RE);
      const type = (typeMatch ? (typeMatch[1] ?? typeMatch[2] ?? typeMatch[3] ?? '') : '').trim().toLowerCase();
      if (!EXECUTABLE_TYPES.has(type)) continue;

      hashes.add(`'sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}'`);
    }
  }

  return [...hashes];
}

function currentNonce(): string | undefined {
  try {
    return (getGlobalStartContext() as unknown as { nonce?: string } | undefined)?.nonce;
  } catch {
    // Called outside the request middleware chain — leave the policy alone.
    return undefined;
  }
}

// Re-issues this response's CSP with the content's script hashes appended.
// h3 lets event.res.headers override a route's `headers` hook (see
// prepareResponse in h3-v2), so the middleware's header is the one to overwrite,
// and doing it here — from the server-only loader — is what actually sticks.
export function allowContentScripts(...sources: (string | null | undefined)[]): void {
  const scriptHashes = inlineScriptHashes(...sources);
  if (!scriptHashes.length) return;

  // No nonce means we'd emit a policy that breaks the app's own scripts; the
  // strict default from start.ts is the safer thing to leave in place.
  const nonce = currentNonce();
  if (!nonce) return;

  setResponseHeader(
    'content-security-policy',
    buildContentSecurityPolicy({
      isDevelopment: import.meta.env.DEV,
      nonce,
      s3BucketName: S3_AWS_S3_BUCKET_NAME,
      scriptHashes,
    })
  );
}
