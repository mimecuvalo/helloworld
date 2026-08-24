import { createFileRoute } from '@tanstack/react-router';
import { setResponseHeader } from '@tanstack/react-start/server';
import app from 'server/app';

// Mounts the portable Hono app for every /api/* request — the single point of
// coupling between TanStack Start and the backend.
const handler = async ({ request }: { request: Request }) => {
  const response = await app.fetch(request);

  // h3 merges the request middleware's headers *over* the ones on a returned
  // Response (prepareResponse in h3-v2), so a route that deliberately relaxes the
  // app-wide CSP — /api/social/feed, for its XSLT stylesheet — would silently lose
  // it. Re-issuing it through the event is what actually sticks.
  const csp = response.headers.get('content-security-policy');
  if (csp) setResponseHeader('content-security-policy', csp);

  return response;
};

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      PATCH: handler,
      DELETE: handler,
      OPTIONS: handler,
      HEAD: handler,
    },
  },
});
