import type { IntlConfig } from 'react-intl';
import fr from 'i18n/compiled/fr.json';

type Messages = NonNullable<IntlConfig['messages']>;

const all: Record<string, Messages> = { fr: fr as Messages };

export function getMessages(locale: string): Messages | undefined {
  return all[locale];
}
