import en from 'i18n/compiled/en.json';
import fr from 'i18n/compiled/fr.json';

const all: Record<string, Record<string, unknown>> = { en, fr };

export function getMessages(locale = 'en'): Record<string, unknown> {
  return all[locale] ?? all.en;
}
