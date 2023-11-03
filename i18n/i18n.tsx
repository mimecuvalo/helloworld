import {
  FormattedDate as originalFormattedDate,
  FormattedNumber as originalFormattedNumber,
  FormattedMessage,
  IntlConfig,
  IntlShape,
  MessageDescriptor,
  createIntlCache,
  createIntl as originalCreateIntl,
  defineMessages as originalDefineMessages,
} from 'react-intl';

import MD5 from 'md5.js';
import { ReactNode } from 'react';

// Re-export everything and override below what we want to override.
export * from 'react-intl';

// @ts-ignore ugh, why are the types from react-intl crap right now??
export const FormattedDate: React.FC<any> = originalFormattedDate;
// @ts-ignore ugh, why are the types from react-intl crap right now??
export const FormattedNumber: React.FC<any> = originalFormattedNumber;

const INTERNAL_LOCALES = ['xx-AE', 'xx-LS'];

// This matches the extraction tool pattern:
//   --id-interpolation-pattern '[md5:contenthash:hex:10]'
function generateId({ id, description, defaultMessage }: MessageDescriptor) {
  if (id) {
    return id;
  }

  return new MD5()
    .update(description ? `${defaultMessage}#${description}` : defaultMessage)
    .digest('hex')
    .slice(0, 10);
}

interface FType extends MessageDescriptor {
  values?: { [key: string]: ((msg: string) => ReactNode) | ReactNode | string | number };
}

export function F(props: FType) {
  const id = generateId(props);
  return (
    <span className="i18n-msg">
      {/* eslint-disable */}
      {/* @ts-ignore fix up */}
      <FormattedMessage id={id} {...props} />
      {/* eslint-enable */}
    </span>
  );
}

// We programmatically define ID's for messages to make things easier for devs.
export function defineMessages(values: Record<string | number | symbol, MessageDescriptor>) {
  for (const key in values) {
    if (!values[key].id) {
      values[key].id = generateId(values[key]);
    }
  }
  return originalDefineMessages(values);
}

export function isInternalLocale(locale: string) {
  return process.env.NODE_ENV === 'development' && INTERNAL_LOCALES.indexOf(locale) !== -1;
}

// This is optional but highly recommended since it prevents memory leaks.
// See: https://formatjs.io/docs/intl/#createintl
const cache = createIntlCache();
let presetIntl: IntlShape | null = null;
let didSetupCreateIntl = false;
export function setupCreateIntl({ defaultLocale, locale, messages }: IntlConfig) {
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

export function createIntl(options: IntlShape) {
  if (options) {
    return originalCreateIntl(options);
  } else {
    if (!didSetupCreateIntl) {
      throw new Error('Need to run setupCreateIntl to use createIntl without options.');
    }
    return presetIntl;
  }
}
