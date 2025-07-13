import { Metadata } from 'next';
import { headers } from 'next/headers';
import SearchClient from './search-client';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search content',
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang } = await params;
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const { q: query } = await searchParams;

  return <SearchClient host={host} query={typeof query === 'string' ? query : ''} lang={lang} />;
}
