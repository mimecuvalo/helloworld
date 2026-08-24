import { createFileRoute } from '@tanstack/react-router';
import app from 'server/app';

// The did:web document for the user who owns this hostname.
const handler = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  url.pathname = '/api/atproto/did.json';
  return app.fetch(new Request(url, request));
};

export const Route = createFileRoute('/.well-known/did.json')({
  server: { handlers: { GET: handler } },
});
