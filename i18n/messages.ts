import { GetStaticPropsContext } from 'next';
import fs from 'fs/promises';
import path from 'path';

const compiledLangCache: { [key: string]: any } = {};

export default async function loadIntlMessages({ locale }: GetStaticPropsContext): Promise<any> {
  if (!locale) return null;

  if (compiledLangCache[locale]) {
    return compiledLangCache[locale];
  }

  const languagePath = path.join(process.cwd(), `i18n/compiled/${locale}.json`);
  try {
    const contents = await fs.readFile(languagePath, 'utf-8');
    const messages = JSON.parse(contents);
    compiledLangCache[locale] = messages;
    return messages;
  } catch (error) {
    console.error('Could not load compiled language files. Please run "yarn i18n:compile" first"');
    console.error(error);
  }

  return null;
}
