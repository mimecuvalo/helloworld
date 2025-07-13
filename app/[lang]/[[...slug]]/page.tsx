import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import ContentClient from './content';

export default async function ContentPage({ params }: { params: Promise<{ lang: string; slug?: string[] }> }) {
  const { slug } = await params;
  const headersList = await headers();
  const host = headersList.get('host') || '';

  const slugArray = slug || [];
  const path = '/' + slugArray.join('/');
  const username = slugArray[0] || '';
  const name = slugArray.length > 1 ? slugArray.slice(-1)[0] : '';

  // Filter out spam and invalid paths
  if (name.includes('.') || username === 'login' || username.includes('.') || path === '/api/v1/instance') {
    notFound();
  }

  /** Paths can look like:
    /:username/search/:query
    /:username/:section/:album/:name
    /:username/:section/:name
    /:username/:name
    /:username
    /
  */

  return <ContentClient host={host} username={username} name={name} />;
}
