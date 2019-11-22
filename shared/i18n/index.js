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
export const F = React.memo(function F({ id, description, msg, values }) {
  return (
    <span className="i18n-msg">
      <FormattedMessage
        id={generateId(id, msg, description)}
        description={description}
        defaultMessage={msg}
        values={values}
      />
    </span>
  );
});

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

export const useIntl = originalUseIntl;
export const FormattedDate = originalFormattedDate;
export const FormattedNumber = originalFormattedNumber;
