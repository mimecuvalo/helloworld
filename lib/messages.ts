import type { IntlConfig } from 'react-intl';
import en from 'i18n/compiled/en.json';
import fr from 'i18n/compiled/fr.json';

// The concrete AST type (rather than Record<string, unknown>) matters: `getMessages` is called
// from inside a server fn, and TanStack validates that a handler's return type is serializable.
type Messages = NonNullable<IntlConfig['messages']>;

const all: Record<string, Messages> = { en: en as Messages, fr: fr as Messages };

export function getMessages(locale = 'en'): Messages {
  return all[locale] ?? all.en;
}
