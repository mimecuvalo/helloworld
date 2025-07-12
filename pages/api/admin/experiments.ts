// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import { REGISTERED_EXPERIMENTS } from '@/application/experiments';
import authenticate from '@/application/authentication';

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json({ experiments: REGISTERED_EXPERIMENTS });
});
