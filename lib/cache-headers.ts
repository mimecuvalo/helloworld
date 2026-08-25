export function contentCacheHeaders(loaderData?: { currentUsername?: string }): Record<string, string> {
  if (loaderData?.currentUsername) {
    return { 'Cache-Control': 'private, no-store' };
  }
  // `Vary` is what makes the public branch safe. Vercel's edge keys on
  // host+path+query only, so without it a stored anonymous copy gets served to
  // everyone who asks for that url — including a logged-in user, who then sees a
  // page with no Edit button and no hidden items, because their `no-store`
  // response is never generated (the origin never runs). Varying on Cookie gives
  // a request carrying a session cookie its own cache key, so it always misses.
  // Accept-Language is here for the same reason: request-init SSRs off it and the
  // `locale` cookie, so an anonymous copy is locale-specific too.
  return {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
    Vary: 'Cookie, Accept-Language',
  };
}
