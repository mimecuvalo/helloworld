import { createFileRoute } from '@tanstack/react-router';
import app from 'server/app';

const handler = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/ap/, '/api/social/ap');
  return app.fetch(new Request(url, request));
};

export const Route = createFileRoute('/ap/$')({
  server: { handlers: { GET: handler, POST: handler } },
});
