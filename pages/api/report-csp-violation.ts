import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.debug('CSP Violation:', JSON.parse(req.body)['csp-report']);
  res.status(204).send('');
}
