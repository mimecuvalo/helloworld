// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import authenticate from 'app/authentication';

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientExceptions = {},
    serverExceptions = {};

  res.json({ clientExceptions, serverExceptions });
});
