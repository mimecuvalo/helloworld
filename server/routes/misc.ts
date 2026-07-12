import { Hono } from 'hono';

export const miscRoutes = new Hono()
  .get('/report-error', (c) => {
    const raw = c.req.query('data');
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : undefined;
    } catch {
      data = raw;
    }
    // Hook up a backend error logging service here if desired (e.g. Sentry).
    console.debug('Error:', data);
    return c.body(null, 204);
  })
  // OpenSearch description so browsers can offer tab-to-search. http://www.opensearch.org/Home
  .get('/opensearch', (c) => {
    const appName = 'Hello, world.';
    const url = `https://${c.req.header('host')}`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
      <ShortName>${appName}</ShortName>
      <Description>Search ${appName}</Description>
      <Url type="text/html" method="get" template="${url}?q={searchTerms}"/>
      <Image height="16" width="16" type="image/jpeg">${url}/favicon.jpg</Image>
    </OpenSearchDescription>
  `;
    return c.body(xml, 200, { 'Content-Type': 'application/xml' });
  });
