import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Hook up a analytics service here on the backend if desired. (e.g. Amplitude)
  console.debug('Analytics:', { eventName: req.body.eventName, data: req.body.data });
  res.status(204).send('');
}
