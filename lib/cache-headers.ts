export function contentCacheHeaders(loaderData?: { currentUsername?: string }): Record<string, string> {
  if (loaderData?.currentUsername) {
    return { 'Cache-Control': 'private, no-store' };
  }
  return { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60' };
}
