import { createFileRoute } from '@tanstack/react-router';
import app from 'server/app';

// atproto clients address `<pds>/xrpc/<nsid>`, so the surface has to sit at the
// root rather than under /api. Same rewrite trick as the .well-known routes.
const handler = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/xrpc/, '/api/atproto');
  return app.fetch(new Request(url, request));
};

export const Route = createFileRoute('/xrpc/$')({
  server: { handlers: { GET: handler, POST: handler } },
});
