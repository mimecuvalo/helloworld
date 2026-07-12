import { createFileRoute } from '@tanstack/react-router';
import { loadSearch } from 'lib/page-data';
import SearchPage from 'components/pages/SearchPage';

// /:username/search/:query — matches ahead of the `$` catch-all (static
// `search` segment outranks the splat). The SiteMap search form navigates here.
export const Route = createFileRoute('/$username/search/$query')({
  loader: ({ params }) => loadSearch({ data: { username: params.username, query: decodeURIComponent(params.query) } }),
  head: () => ({ meta: [{ title: 'search' }] }),
  component: RouteComponent,
});

function RouteComponent() {
  return <SearchPage data={Route.useLoaderData()} />;
}
