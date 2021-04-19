import {
  FormattedMessage,
  createIntlCache,
  createIntl as originalCreateIntl,
  defineMessages as originalDefineMessages,
} from 'react-intl';

import MD5 from 'md5.js';

// Re-export everything and override below what we want to override.
export * from 'react-intl';

const SETTINGS = {
  defaultLocale: 'en',
  locales: ['en', 'fr'],
};

const INTERNAL_LOCALES = ['xx-AE', 'xx-LS'];

// This matches the extraction tool pattern:
//   --id-interpolation-pattern '[md5:contenthash:hex:10]'
function generateId({ id, description, defaultMessage }) {
  if (id) {
    return id;
  }

  return new MD5()
    .update(description ? `${defaultMessage}#${description}` : defaultMessage)
    .digest('hex')
    .slice(0, 10);
}

export function F(props) {
  const id = generateId(props);
  return (
    <span className="i18n-msg">
      <FormattedMessage id={id} {...props} />
    </span>
  );
}

// We programmatically define ID's for messages to make things easier for devs.
export function defineMessages(values) {
  for (const key in values) {
    if (!values[key].id) {
      values[key].id = generateId(values[key]);
    }
  }
  return originalDefineMessages(values);
}

export function setLocales({ defaultLocale, locales }) {
  SETTINGS.defaultLocale = defaultLocale;
  SETTINGS.locales = locales;
}

export function getDefaultLocale() {
  return SETTINGS.defaultLocale;
}

export function getLocales() {
  return SETTINGS.locales;
}

// Based on the request object (and other metrics, if you so chose) deduce the locale
// that the app should be rendered with.
export function getLocaleFromRequest(req) {
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
    const possibleLanguages = rawHeader.split(',').map((lang) => lang.replace(/;q=.*/, ''));
    for (const language of possibleLanguages) {
      const locale = findRelevantLocale(language);
      if (locale) {
        return locale;
      }
    }
  }

  // Final fallback
  return SETTINGS.defaultLocale;
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
  return SETTINGS.locales.indexOf(locale) !== -1 || isInternalLocale(locale);
}

export function isInternalLocale(locale) {
  return process.env.NODE_ENV === 'development' && INTERNAL_LOCALES.indexOf(locale) !== -1;
}

// This is optional but highly recommended since it prevents memory leaks.
// See: https://formatjs.io/docs/intl/#createintl
const cache = createIntlCache();
let presetIntl = null;
let didSetupCreateIntl = false;
export function setupCreateIntl({ defaultLocale, locale, messages }) {
  presetIntl = originalCreateIntl(
    {
      defaultLocale,
      locale,
      messages,
    },
    cache
  );

  didSetupCreateIntl = true;
}

export function createIntl(options) {
  if (options) {
    return originalCreateIntl(options);
  } else {
    if (!didSetupCreateIntl) {
      throw new Error('Need to run setupCreateIntl to use createIntl without options.');
    }
    return presetIntl;
  }
}
