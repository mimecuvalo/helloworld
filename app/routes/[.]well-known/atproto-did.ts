import { createFileRoute } from '@tanstack/react-router';
import app from 'server/app';

// Handle resolution for the user who owns this hostname: their bare DID.
const handler = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  url.pathname = '/api/atproto/atproto-did';
  return app.fetch(new Request(url, request));
};

export const Route = createFileRoute('/.well-known/atproto-did')({
  server: { handlers: { GET: handler } },
});
