import type { QueryClient } from '@tanstack/react-query';

// Reaching the bottom of the feed marks every remaining item read at once, so
// the counts would otherwise be invalidated twice per item. Coalesce into one
// pair of refetches.
let timer: ReturnType<typeof setTimeout> | undefined;

export function invalidateCountsSoon(queryClient: QueryClient) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    queryClient.invalidateQueries({ queryKey: ['feed-counts'] });
    queryClient.invalidateQueries({ queryKey: ['total-counts'] });
  }, 300);
}
