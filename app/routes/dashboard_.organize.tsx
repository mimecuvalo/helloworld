import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { buildFaviconLinks } from 'lib/content-head';
import { loadDashboard } from 'lib/page-data';
import OrganizePage from 'components/pages/OrganizePage';

// `dashboard_` keeps the /dashboard/organize url without nesting inside the
// dashboard route — the reader's nav and feed have no business rendering here.
export const Route = createFileRoute('/dashboard_/organize')({
  loader: async () => {
    const data = await loadDashboard();
    if (!data.user) throw redirect({ href: '/api/auth/signin' });
    if (!data.user.superuser) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: 'Organize sidebar' }],
    links: buildFaviconLinks(loaderData?.user?.favicon),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useLoaderData();
  return <OrganizePage user={user!} />;
}
