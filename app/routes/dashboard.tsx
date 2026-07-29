import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { buildFaviconLinks } from 'lib/content-head';
import { loadDashboard } from 'lib/page-data';
import DashboardPage from 'components/pages/DashboardPage';

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const data = await loadDashboard();
    if (!data.user) throw redirect({ href: '/api/auth/signin' });
    if (!data.user.superuser) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: 'Dashboard' }],
    links: buildFaviconLinks(loaderData?.user?.favicon),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useLoaderData();
  return <DashboardPage user={user!} />;
}
