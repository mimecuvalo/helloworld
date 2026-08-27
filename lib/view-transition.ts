import { flushSync } from 'react-dom';

// `startViewTransition` isn't in TS's DOM lib everywhere yet.
type ViewTransition = { finished: Promise<void>; skipTransition: () => void };
type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

// Which lightbox animation the CSS should run — read off `data-view-transition`
// on <html> for the duration of the transition. See styles/globals.css.
export type ViewTransitionKind = 'open' | 'close' | 'next' | 'prev';

let inFlight: ViewTransition | null = null;

/**
 * Run `update` inside a view transition, tagging <html> so CSS can pick the
 * right animation. Falls back to a plain update where the API is missing.
 * Resolves once the animation is done (or immediately, on the fallback path).
 */
export function withViewTransition(kind: ViewTransitionKind, update: () => void): Promise<void> {
  const doc = document as DocumentWithViewTransition;
  if (!doc.startViewTransition) {
    update();
    return Promise.resolve();
  }

  // Only one transition can run at a time — jump the current one to its end so
  // rapid arrow presses land on the newest frame instead of queueing up.
  inFlight?.skipTransition();

  doc.documentElement.dataset.viewTransition = kind;
  const transition = doc.startViewTransition(() => flushSync(update));
  inFlight = transition;
  return transition.finished
    .catch(() => {})
    .then(() => {
      if (inFlight !== transition) return;
      inFlight = null;
      delete doc.documentElement.dataset.viewTransition;
    });
}
