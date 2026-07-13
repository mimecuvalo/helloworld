// Side-effect-only packages (font CSS) with no bundled type declarations.
// tsgo (TypeScript 7) rejects untyped side-effect imports that tsc tolerated.
declare module '@fontsource-variable/*';
declare module '@fontsource/*';

declare module 'swipe-listener' {
  export default function SwipeListener(element: HTMLElement): { off(): void };
}
