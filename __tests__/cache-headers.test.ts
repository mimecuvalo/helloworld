import { describe, expect, it } from 'vitest';
import { contentCacheHeaders } from 'lib/cache-headers';

describe('contentCacheHeaders', () => {
  it('never stores a response for a logged-in user', () => {
    expect(contentCacheHeaders({ currentUsername: 'mime' })).toEqual({ 'Cache-Control': 'private, no-store' });
  });

  it('varies the public copy on Cookie so a session cookie can never hit it', () => {
    // Without Vary: Cookie the edge would serve a stored anonymous page to a
    // logged-in user — no Edit button, no hidden items — since the cache key is
    // just host+path+query and the origin never runs to emit `no-store`.
    const headers = contentCacheHeaders({});

    expect(headers['Cache-Control']).toBe('public, s-maxage=60, stale-while-revalidate=60');
    expect(headers.Vary).toBe('Cookie, Accept-Language');
  });

  it('varies the public copy for an absent loader payload too', () => {
    expect(contentCacheHeaders()).toEqual(contentCacheHeaders({}));
  });

  it('leaves Vary off the private copy, which is uncacheable anyway', () => {
    expect(contentCacheHeaders({ currentUsername: 'mime' }).Vary).toBeUndefined();
  });
});
