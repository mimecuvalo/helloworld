import type { QueryClient } from '@tanstack/react-query';

// Reaching the bottom of the feed marks every remaining item read at once, so
// the counts would otherwise be invalidated once per item. Coalesce into a
// single refetch.
let timer: ReturnType<typeof setTimeout> | undefined;

export function invalidateCountsSoon(queryClient: QueryClient) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    queryClient.invalidateQueries({ queryKey: ['counts'] });
  }, 300);
}
