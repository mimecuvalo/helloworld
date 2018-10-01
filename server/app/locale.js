export const DEFAULT_LOCALE = 'en';

export const LOCALES = ['en', 'fr'];

// Based on the request object (and other metrics, if you so chose) deduce the locale
// that the app should be rendered with.
export function getLocale(req) {
  // You can add logic here to extract a locale from your user object.
  // if (user.preferences.locale) {
  //   return findRelevantLocale(user.preferences.locale);
  // }

  // Language override via URL.
  if (req.query.lang) {
    const locale = findRelevantLocale(req.query.lang);
    if (locale) {
      return locale;
    }
  }

  // If not in user's preferences, we try to extract from the browser 'Accept-Language' header.
  if (req.headers['accept-language']) {
    const rawHeader = req.headers['accept-language'];
    const possibleLanguages = rawHeader.split(',').map(lang => lang.replace(/;q=.*/, ''));
    for (const language of possibleLanguages) {
      const locale = findRelevantLocale(language);
      if (locale) {
        return locale;
      }
    }
  }

  // Final fallback
  return DEFAULT_LOCALE;
}

// Find the exact match locale, if supported, or the next best locale if possible.
// e.g. if `fr-FR` isn't found then `fr` will be used.
function findRelevantLocale(locale) {
  if (isValidLocale(locale)) {
    return locale;
  }

  const baseLocale = locale.split('-')[0];
  if (isValidLocale(baseLocale)) {
    return baseLocale;
  }
}

// Whether the locale is found in our supported locale list. Must be exact.
export function isValidLocale(locale) {
  return LOCALES.indexOf(locale) !== -1;
}
