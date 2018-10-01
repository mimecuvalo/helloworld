import {
  defineMessages as originalDefineMessages,
  FormattedHTMLMessage,
  FormattedMessage,
  injectIntl as originalInjectIntl,
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
export const F = React.memo(function F({ id, description, msg, values }) {
  return (
    <FormattedMessage
      id={generateId(id, msg, description)}
      description={description}
      defaultMessage={msg}
      values={values}
    />
  );
});

// The main way to translate a string, but with HTML included.
//
// *DANGER* Use sparingly. This uses dangerouslySetInnerHTML underneath.
// Whenever possible, you should do something like:
//  <F
//    msg="Edit {code} and save to reload."
//    values={{
//      code: <code>src/App.js</code>,
//    }}
//  />
//
// The annoying thing is that you have examples like this:
//  <F
//    msg="Edit {link} and save to reload."
//    values={{
//      link: <a href="#"><F msg="this link" /></a>,
//    }}
//  />
// which then splits the translation into two different strings which is hell for your translation team.
// That's where FHTML comes in. But use only if you don't have any user-set information included since it would
// be an XSS vector.
export const FHTML = React.memo(function FHTML({ id, description, msg, values }) {
  return (
    <FormattedHTMLMessage
      id={generateId(id, msg, description)}
      description={description}
      defaultMessage={msg}
      values={values}
    />
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

export const injectIntl = originalInjectIntl;
