import { createFileRoute, notFound } from '@tanstack/react-router';
import { loadContentPage } from 'lib/page-data';
import { buildContentHead } from 'lib/content-head';
import ContentPage from 'components/pages/ContentPage';

// Multi-tenant catch-all content route.
//   /:username, /:username/:name, /:username/:section/:name, /:username/:section/:album/:name
export const Route = createFileRoute('/$')({
  headers: () => ({ 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }),
  loader: async ({ params }) => {
    const slug = (params._splat || '').split('/').filter(Boolean);
    const username = slug[0] || '';
    const name = slug.length > 1 ? slug[slug.length - 1] : '';

    // Spam guards
    if (name.includes('.') || username === 'login' || username.includes('.')) {
      throw notFound();
    }

    const data = await loadContentPage({ data: { username, name: username ? name || 'home' : '' } });
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
