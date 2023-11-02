import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hook up a error logging service here on the backend if desired (e.g. Sentry).
  console.debug('Error:', req.query.data ? JSON.parse(req.query.data as string) : req.body.data);
  res.status(204).send('');
}
