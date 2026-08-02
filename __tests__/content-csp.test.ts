import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy } from 'lib/security';
import { inlineScriptHashes } from 'server/content-csp';

const sha256 = (body: string) => `'sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}'`;

describe('inlineScriptHashes', () => {
  it('hashes the exact bytes between the tags', () => {
    const body = "\n  document.title = 'hi';\n";
    expect(inlineScriptHashes(`<p>x</p><script>${body}</script>`)).toEqual([sha256(body)]);
  });

  it('matches what the browser hashes for markup the parser sees', () => {
    // Locks in the canonical example from the CSP spec's hash algorithm: the
    // digest covers the script's text content with no trimming or re-encoding.
    expect(inlineScriptHashes("<script>alert('Hello, world.');</script>")).toEqual([
      "'sha256-qznLcsROx4GACP2dm0UCKCzCG+HiZ1guq6ZZDob/Tng='",
    ]);
  });

  it('collects scripts across every source and de-duplicates them', () => {
    const hashes = inlineScriptHashes('<script>a()</script>', '<script>b()</script>', '<script>a()</script>');
    expect(hashes).toEqual([sha256('a()'), sha256('b()')]);
  });

  it('skips external scripts, which a source hash cannot cover', () => {
    expect(inlineScriptHashes('<script src="https://cdn.example.com/x.js"></script>')).toEqual([]);
    expect(inlineScriptHashes('<script src="/local.js">ignored()</script>')).toEqual([]);
  });

  it('skips non-executable script types', () => {
    expect(inlineScriptHashes('<script type="application/ld+json">{"a":1}</script>')).toEqual([]);
    expect(inlineScriptHashes('<script type="text/template"><div></div></script>')).toEqual([]);
    expect(inlineScriptHashes('<script type="importmap">{}</script>')).toEqual([]);
  });

  it('includes executable types and attribute noise', () => {
    expect(inlineScriptHashes('<script type="module">go()</script>')).toEqual([sha256('go()')]);
    expect(inlineScriptHashes("<script type='text/javascript' defer>go()</script>")).toEqual([sha256('go()')]);
    expect(inlineScriptHashes('<script TYPE=text/javascript>go()</script>')).toEqual([sha256('go()')]);
  });

  it('ignores empty and absent scripts', () => {
    expect(inlineScriptHashes('<script></script>', '<script>   </script>', '<p>no scripts</p>')).toEqual([]);
    expect(inlineScriptHashes(null, undefined, '')).toEqual([]);
  });
});

describe('buildContentSecurityPolicy with content script hashes', () => {
  const policy = (scriptHashes?: string[]) =>
    buildContentSecurityPolicy({ isDevelopment: false, nonce: 'request-nonce', scriptHashes });

  it('appends hashes after the nonce and strict-dynamic', () => {
    expect(policy([sha256('go()')])).toContain(
      `script-src 'self' 'nonce-request-nonce' 'strict-dynamic' ${sha256('go()')}`
    );
  });

  it('never emits hashes without a nonce, which would drop the app policy', () => {
    const withoutNonce = buildContentSecurityPolicy({ isDevelopment: false, scriptHashes: [sha256('go()')] });
    expect(withoutNonce).not.toContain('sha256-');
  });

  it('keeps unsafe-inline (and no hashes) in development', () => {
    // A hash would make the browser ignore 'unsafe-inline' and break dev.
    const dev = buildContentSecurityPolicy({ isDevelopment: true, nonce: 'n', scriptHashes: [sha256('go()')] });
    expect(dev).toContain("'unsafe-inline'");
    expect(dev).not.toContain('sha256-');
  });

  it('does not widen script-src for user uploads', () => {
    // 'strict-dynamic' already neutralizes host allowlists, but /resource/* 308s to
    // the bucket, so the bucket must never become a script source.
    const scriptSrc = policy()
      .split('; ')
      .find((d) => d.startsWith('script-src'))!;
    expect(scriptSrc).not.toContain('amazonaws');
  });
});
