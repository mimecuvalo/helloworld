import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { getMessages } from 'lib/messages';

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

// The compiled message catalog is resolved inside the server-fn handler (rather than in the
// root loader) so `lib/messages` never enters the client graph — otherwise Vite inlines all of
// i18n/compiled/*.json into the client entry chunk on top of the copy already dehydrated into
// the SSR payload, shipping the whole catalog to every visitor twice.
export const initRequest = createServerFn({ method: 'GET' }).handler(() => {
  const locale = detectLocale();
  return { locale, messages: getMessages(locale) };
});
