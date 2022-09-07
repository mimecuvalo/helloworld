// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

import authenticate from 'app/authentication';

export default authenticate(async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Also, this is disabled by default because it's so powerful (a powerful footgun, that is).
  // Enabling this means you need to make damn sure the API you're calling is internally accessible only.
  return res.json({
    result: 'DISABLED_FOR_SECURITY_DONT_ENABLE_UNLESS_YOU_KNOW_WHAT_YOURE_DOING',
    success: false,
  });

  // const source = req.body.source;
  // let success = true;
  // let result = null;
  // try {
  //   result = eval(source);
  // } catch (ex) {
  //   success = false;
  //   console.log(ex);
  // }
  // res.json({ result, success });
});
