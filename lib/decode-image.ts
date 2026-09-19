// How long we'll wait for an image to decode before animating anyway — past
// this the transition is better than the stall.
const DECODE_BUDGET_MS = 300;

/**
 * Resolve once `src` is decoded and ready to paint, or once the budget runs
 * out, whichever comes first.
 *
 * A view transition snapshots whatever is on screen at that instant, so an
 * undecoded image morphs into an empty box and then pops. Waiting fixes that,
 * but waiting indefinitely on a slow image is worse than a plain cut.
 */
export function decodeSoon(src: string | undefined | null): Promise<unknown> {
  if (!src) return Promise.resolve();
  const image = new Image();
  image.src = src;
  // Not everything that runs this has decode() — jsdom doesn't. Nothing here
  // is load-bearing, so where it's missing we just don't wait.
  const decoded = image.decode?.().catch(() => {});
  if (!decoded) return Promise.resolve();
  return Promise.race([decoded, new Promise((resolve) => setTimeout(resolve, DECODE_BUDGET_MS))]);
}
