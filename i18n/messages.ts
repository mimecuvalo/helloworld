import { GetStaticPropsContext } from 'next';
import fs from 'fs/promises';
import path from 'path';
import enJson from '../i18n-compiled-lang/en.json';

export default async function loadIntlMessages({ locale, defaultLocale }: GetStaticPropsContext): Promise<any> {
  if (locale === defaultLocale) {
    return enJson;
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
