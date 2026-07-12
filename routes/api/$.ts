import { createFileRoute } from '@tanstack/react-router';
import app from 'server/app';

// Mounts the portable Hono app for every /api/* request — the single point of
// coupling between TanStack Start and the backend.
const handler = ({ request }: { request: Request }) => app.fetch(request);

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
