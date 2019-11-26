import { defineMessages as originalDefineMessages, FormattedMessage, useIntl as originalUseIntl } from 'react-intl';
import extraction from './extraction';
import React from 'react';

// Re-export everything and override below what we want to override.
export * from 'react-intl';

// For the Babel transform plugin.
export default extraction;

// Our i18n implementation tries to simplify the workflow for the developer
// such that they don't have to explicitly provide an ID every time which can be cumbersome.
// Nonetheless, it's still required by react-intl so we programmatically create an ID based on the message.
// NOTE: This is in sync with i18n-extraction/index.js id generation.
export function generateId(id = '', msg = '', description = '') {
  if (id) {
    return id;
  }

  const scrubbedMsg = msg.replace(/\W/g, '_');
  const scrubbedDesc = description.replace(/\W/g, '_');

  return scrubbedMsg + (scrubbedDesc ? '___' : '') + scrubbedDesc;
}

// The main way to translate a string.
// To include HTML in the string you can do:
// <F
//   msg="To buy a shoe, <a>visit our website</a> and <cta>eat a shoe</cta>"
//   values={{
//     a: msg => (
//       <a className="external-link" target="_blank" rel="noopener noreferrer" href="https://www.shoe.com/">
//         {msg}
//       </a>
//     ),
//     cta: msg => <strong>{msg}</strong>,
//   }}
// />
// We also augment the original FormattedMessage to add fallback capability.
export function F({ id, description, fallback, msg, values }) {
  const intl = originalUseIntl();

  const generatedId = generateId(id, msg, description);
  if (intl.locale !== 'en' && fallback && !intl.messages[generatedId]) {
    return fallback;
  }

  msg = transformInternalLocaleMsg(intl.locale, msg);

  // XXX(mime): Workaround. We do this destructuring of props like this to avoid detection by the
  // i18n message extractor (which would otherwise error here and complain of not
  // having static values for FormattedMessage).
  const props = { id: generatedId, description, defaultMessage: msg, values };

  return (
    <span className="i18n-msg">
      <FormattedMessage {...props} />
    </span>
  );
}

const ACCENTS = {
  a: 'ã',
  b: 'b́',
  c: 'č',
  d: 'đ',
  e: 'ĕ',
  f: 'f́',
  g: 'ġ',
  h: 'ĥ',
  i: 'ĩ',
  j: 'ĵ',
  k: 'ķ',
  l: 'ĺ',
  m: 'ḿ',
  n: 'ñ',
  o: 'ø',
  p: 'ƥ',
  q: 'ʠ',
  r: 'ř',
  s: 'š',
  t: 't́',
  u: 'ū',
  v: 'v̂',
  w: 'ŵ',
  x: 'x̄',
  y: 'ẙ',
  z: 'ž',
};

function transformInternalLocaleMsg(locale, msg) {
  if (locale === 'xx-AE') {
    let newMsg = '';
    let inBracket = false;
    for (let i = 0; i < msg.length; ++i) {
      if (msg[i] === '<' || msg[i] === '{') {
        inBracket = true;
      }
      if (msg[i] === '>' || msg[i] === '}') {
        inBracket = false;
      }
      if (!inBracket && /[a-zA-Z]/.test(msg[i])) {
        newMsg += /[a-z]/.test(msg[i]) ? ACCENTS[msg[i]] : ACCENTS[msg[i]].toUpperCase();
      } else {
        newMsg = msg[i];
      }
    }
    msg = newMsg;
  }

  if (locale === 'xx-LS') {
    msg += 'Looooooooooooooooooooooooooooooooooooooooong';
  }

  return msg;
}

// We programmatically define ID's for messages to make things easier for devs.
export function defineMessages(values) {
  for (const key in values) {
    if (!values[key].id) {
      values[key].id = generateId('', values[key].msg, values[key].description);
      values[key].defaultMessage = values[key].msg;
    }
  }
  return originalDefineMessages(values);
}

// We wrap the originalUseIntl so that we can add fallback capability.
export function useIntl() {
  const intl = originalUseIntl();

  const originalFormatMessage = intl.formatMessage;
  intl.formatMessage = (descriptor, values, fallbackDescriptor) => {
    descriptor.defaultMessage = transformInternalLocaleMsg(intl.locale, descriptor.defaultMessage);
    if (fallbackDescriptor) {
      fallbackDescriptor.defaultMessage = transformInternalLocaleMsg(intl.locale, fallbackDescriptor.defaultMessage);
    }

    const generatedId = generateId(descriptor.id, descriptor.defaultMessage, descriptor.description);
    if (intl.locale !== 'en' && fallbackDescriptor && !intl.messages[generatedId]) {
      return originalFormatMessage(fallbackDescriptor, values);
    }

    return originalFormatMessage(descriptor, values);
  };

  return intl;
}
