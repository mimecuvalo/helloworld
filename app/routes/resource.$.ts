import { createFileRoute } from '@tanstack/react-router';
import { S3_AWS_S3_BUCKET_NAME } from 'server/config';

const handler = ({ request }: { request: Request }) => {
  const path = new URL(request.url).pathname.replace(/^\/resource\/?/, '');
  return Response.redirect(`https://${S3_AWS_S3_BUCKET_NAME}/${path}`, 308);
};

export const Route = createFileRoute('/resource/$')({
  server: { handlers: { GET: handler } },
});
