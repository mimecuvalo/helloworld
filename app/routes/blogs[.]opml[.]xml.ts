import { createFileRoute } from '@tanstack/react-router';
import app from 'server/app';

// The site's blogroll, at the conventional /blogs.opml.xml. No ?resource=, so
// the endpoint answers for the default user (hostname owner, else the first
// account) — the same user the homepage renders.
const handler = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  url.pathname = '/api/social/opml';
  url.search = '';
  return app.fetch(new Request(url, request));
};

export const Route = createFileRoute('/blogs.opml.xml')({
  server: { handlers: { GET: handler } },
});
