import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { buildFaviconLinks } from 'lib/content-head';
import { loadDashboard } from 'lib/page-data';
import MediaPage from 'components/pages/MediaPage';

// `dashboard_` keeps the /dashboard/media url without nesting inside the
// dashboard route — the reader's nav and feed have no business rendering here.
export const Route = createFileRoute('/dashboard_/media')({
  loader: async () => {
    const data = await loadDashboard();
    if (!data.user) throw redirect({ href: '/api/auth/signin' });
    if (!data.user.superuser) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: 'Media manager' }],
    links: buildFaviconLinks(loaderData?.user?.favicon),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useLoaderData();
  return <MediaPage user={user!} />;
}
