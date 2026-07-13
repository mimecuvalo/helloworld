import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';

export const SUPPORTED_LOCALES = ['en', 'fr', 'xx-LS'] as const;
export const DEFAULT_LOCALE = 'en';

function detectLocale(): string {
  const cookie = getRequestHeader('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const fromCookie = match?.[1];
  if (fromCookie && (SUPPORTED_LOCALES as readonly string[]).includes(fromCookie)) {
    return fromCookie;
  }

  const accept = getRequestHeader('accept-language') ?? '';
  if (/\bfr\b/.test(accept)) return 'fr';

  return DEFAULT_LOCALE;
}

export const initRequest = createServerFn({ method: 'GET' }).handler(() => {
  return { locale: detectLocale() };
});
