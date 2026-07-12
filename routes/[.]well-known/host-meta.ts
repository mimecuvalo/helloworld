import { createFileRoute } from '@tanstack/react-router';
import app from 'server/app';

const handler = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  url.pathname = '/api/social/.well-known/host-meta';
  return app.fetch(new Request(url, request));
};

export const Route = createFileRoute('/.well-known/host-meta')({
  server: { handlers: { GET: handler } },
});
