import {
  defineMessages as originalDefineMessages,
  FormattedDate as originalFormattedDate,
  FormattedMessage,
  FormattedNumber as originalFormattedNumber,
  useIntl as originalUseIntl,
} from 'react-intl';
import React from 'react';

// Our i18n implementation tries to simplify the workflow for the developer
// such that they don't have to explicitly provide an ID every time which can be cumbersome.
// Nonetheless, it's still required by react-intl so we programmatically create an ID based on the message.
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

  return (
    <span className="i18n-msg">
      <FormattedMessage id={generatedId} description={description} defaultMessage={msg} values={values} />
    </span>
  );
}

const ACCENTS = {
  a: 'ä',
  b: 'b̂',
  c: 'ç',
  d: 'đ',
  e: 'è',
  f: 'ḟ',
  g: 'ğ',
  h: 'ȟ',
  i: 'î',
  j: 'j̊',
  k: 'ⱪ',
  l: 'ĺ',
  m: 'ḿ',
  n: 'ñ',
  o: 'ø',
  p: 'ƥ',
  q: 'ʠ',
  r: 'r̆',
  s: 'š',
  t: 'ț',
  u: 'ü',
  v: 'v̂',
  w: 'ẘ',
  x: 'x̄',
  y: 'ẙ',
  z: 'ż',
  A: 'Ä',
  B: 'B̂',
  C: 'Ç',
  D: 'Đ',
  E: 'È',
  F: 'Ḟ',
  G: 'Ğ',
  H: 'Ȟ',
  I: 'Î',
  J: 'J̊',
  K: 'Ⱪ',
  L: 'Ĺ',
  M: 'Ḿ',
  N: 'Ñ',
  O: 'Ø',
  P: 'Ƥ',
  Q: 'ʠ',
  R: 'R̆',
  S: 'Š',
  T: 'Ț',
  U: 'Ü',
  V: 'V̂',
  W: 'W̊',
  X: 'X̄',
  Y: 'Y̊',
  Z: 'Ż',
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
      newMsg += !inBracket && /[a-zA-Z]/.test(msg[i]) ? ACCENTS[msg[i]] : msg[i];
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

export const FormattedDate = originalFormattedDate;
export const FormattedNumber = originalFormattedNumber;
