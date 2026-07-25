import { createFileRoute, notFound } from '@tanstack/react-router';
import { loadContentPage } from 'lib/page-data';
import { buildContentHead } from 'lib/content-head';
import { contentCacheHeaders } from 'lib/cache-headers';
import ContentPage from 'components/pages/ContentPage';

// Homepage → the default user's main page (resolved server-side by hostname / id:1).
export const Route = createFileRoute('/')({
  headers: ({ loaderData }) => contentCacheHeaders(loaderData),
  loader: async () => {
    const data = await loadContentPage({ data: { username: '', name: '' } });
    if (!data.content) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: 'hello, world.' }] };
    const title =
      (loaderData.content?.title ? loaderData.content.title + ' – ' : '') + (loaderData.contentOwner?.title ?? '') ||
      'hello, world.';
    return buildContentHead({
      content: loaderData.content,
      contentOwner: loaderData.contentOwner,
      host: loaderData.host,
      title,
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <ContentPage data={Route.useLoaderData()} />;
}
