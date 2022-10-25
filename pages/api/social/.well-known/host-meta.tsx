import type { NextApiRequest, NextApiResponse } from 'next';

import { buildUrl } from 'util/url-factory';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const webFingerUrl = buildUrl({ req, pathname: `/.well-known/webfinger` });

  res.setHeader('Content-Type', 'application/xrd+xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
    <XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0" xmlns:hm="http://host-meta.net/xrd/1.0">
      <hm:Host>${buildUrl({ req, pathname: '' })}</hm:Host>
      <Link rel="lrdd" type="application/json" template="${webFingerUrl}?resource={uri}" />
      <Link rel="lrdd" type="application/xrd+xml" template="${webFingerUrl}?format=xml&amp;resource={uri}" />
    </XRD>`);
}
