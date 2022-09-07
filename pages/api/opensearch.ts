import type { NextApiRequest, NextApiResponse } from 'next';

// OpenSearch is a way to tell your browser to let a user hit <tab> and search your site.
// See http://www.opensearch.org/Home
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const appName = 'Next.js: All The Things';
  const url = `https://${req.headers.host}`;

  res.status(200).setHeader('Content-Type', 'application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
    <OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
      <ShortName>${appName}</ShortName>
      <Description>Search ${appName}</Description>
      <Url type="text/html" method="get" template="${url}?q={searchTerms}"/>
      <Image height="16" width="16" type="image/x-icon">${url}/favicon.ico</Image>
    </OpenSearchDescription>
  `);
}
