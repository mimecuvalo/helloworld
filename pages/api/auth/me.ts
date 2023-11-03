import type { NextApiRequest, NextApiResponse } from 'next';

import auth0 from 'vendor/auth0';

export default async function me(req: NextApiRequest, res: NextApiResponse) {
  try {
    await auth0.handleProfile(req, res, { refetch: true });
  } catch (error: any) {
    console.error(error);
    res.status(error.status || 500).end(error.message);
  }
}
