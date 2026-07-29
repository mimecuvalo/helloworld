import { createFileRoute } from '@tanstack/react-router';
import app from 'server/app';

const handler = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  url.pathname = '/api/social/.well-known/webfinger';
  return app.fetch(new Request(url, request));
};

export const Route = createFileRoute('/.well-known/webfinger')({
  server: { handlers: { GET: handler } },
});
