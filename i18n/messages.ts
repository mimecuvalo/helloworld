import { GetStaticPropsContext } from 'next';
import fs from 'fs/promises';
import path from 'path';

type MessageConfig = { [key: string]: string };

export default async function loadIntlMessages({
  locale,
  defaultLocale,
}: GetStaticPropsContext): Promise<MessageConfig> {
  // If the default locale is being used we can skip it
  if (locale === defaultLocale) {
    return {};
  }

  if (locale !== defaultLocale) {
    const languagePath = path.join(process.cwd(), `i18n-compiled-lang/${locale}.json`);
    try {
      const contents = await fs.readFile(languagePath, 'utf-8');
      return JSON.parse(contents);
    } catch (error) {
      console.error('Could not load compiled language files. Please run "yarn i18n:compile" first"');
      console.error(error);
    }
  }

  return {};
}
