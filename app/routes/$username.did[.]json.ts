import { createFileRoute } from '@tanstack/react-router';
import app from 'server/app';

// did:web:<host>:<username> resolves here — the shared-host form, for users who
// don't have a domain of their own.
const handler = ({ request, params }: { request: Request; params: { username: string } }) => {
  const url = new URL(request.url);
  url.pathname = '/api/atproto/did.json';
  url.searchParams.set('username', params.username);
  return app.fetch(new Request(url, request));
};

export const Route = createFileRoute('/$username/did.json')({
  server: { handlers: { GET: handler } },
});
