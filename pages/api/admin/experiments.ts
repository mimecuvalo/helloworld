// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import { REGISTERED_EXPERIMENTS } from 'app/experiments';
import authenticate from 'app/authentication';

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json({ experiments: REGISTERED_EXPERIMENTS });
});
