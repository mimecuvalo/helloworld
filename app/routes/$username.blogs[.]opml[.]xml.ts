import { createFileRoute } from '@tanstack/react-router';
import app from 'server/app';

// Per-user blogroll: /:username/blogs.opml.xml.
const handler = ({ request, params }: { request: Request; params: { username: string } }) => {
  const url = new URL(request.url);
  url.pathname = '/api/social/opml';
  url.search = '';
  url.searchParams.set('resource', `/${params.username}`);
  return app.fetch(new Request(url, request));
};

export const Route = createFileRoute('/$username/blogs.opml.xml')({
  server: { handlers: { GET: handler } },
});
