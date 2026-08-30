import flowersCssUrl from './flowers/globals.css?url';

export const DEFAULT_THEME = 'nightlight';

// The theme names, split out from the stylesheets below so callers that only
// need to list or validate a theme (the profile editor, the server) don't drag
// a skin's CSS along with them.
export const THEMES = ['nightlight', 'flowers'] as const;

// Each theme's global skin as an emitted stylesheet URL rather than a string
// baked into a JS chunk — the flowers CSS used to ride along in the shared
// SiteMap chunk and download for every visitor on every theme. nightlight is
// the default palette, which content-theme.css already carries, so it has no
// skin of its own.
export const themeStylesheet: Record<string, string | undefined> = {
  nightlight: undefined,
  flowers: flowersCssUrl,
};
