import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hook up a error logging service here on the backend if desired (e.g. Sentry).
  console.log('Error:', JSON.parse(req.query.data || req.body.data));
  res.status(204).send('');
}
