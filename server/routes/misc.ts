import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { isRobotViewing } from '../crawler';
import { parseContentUrl } from 'lib/url-factory';

// 1x1 transparent GIF for the view-tracking pixel.
const TRACKING_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

export const miscRoutes = new Hono<AppEnv>()
  .post('/report-error', async (c) => {
    let data: unknown;
    try {
      data = ((await c.req.json()) as { data?: unknown })?.data;
    } catch {
      data = undefined;
    }
    // Hook up a backend error logging service here if desired .
    console.debug('Error:', data);
    return c.body(null, 204);
  })
  // View-tracking pixel embedded in Atom feeds / oEmbed output. Increments the
  // content's human vs robot view count for reads that don't hit the SSR page
  // (feed readers, cached embeds). Ported from the old /api/stats endpoint.
  .get('/stats', async (c) => {
    const ctx = c.get('ctx');
    const { username, name } = parseContentUrl(c.req.query('resource') || '');
    if (username && name) {
      const content = await ctx.prisma.content.findUnique({ where: { username_name: { username, name } } });
      if (content) {
        const data = isRobotViewing(c.req.raw) ? { countRobot: content.countRobot + 1 } : { count: content.count + 1 };
        await ctx.prisma.content.update({ data, where: { username_name: { username, name: content.name } } });
      }
    }
    return c.body(TRACKING_GIF, 200, { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' });
  })
  // OpenSearch description so browsers can offer tab-to-search. http://www.opensearch.org/Home
  .get('/opensearch', (c) => {
    const appName = 'Hello, world.';
    const requestUrl = new URL(c.req.url);
    const host = c.req.header('x-hw-host') || c.req.header('host') || requestUrl.host;
    const url = `${requestUrl.protocol}//${host}`;
    const username = encodeURIComponent(c.req.query('username') || '');
    const searchPath = username ? `/${username}/search/{searchTerms}` : '/search/{searchTerms}';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
      <ShortName>${appName}</ShortName>
      <Description>Search ${appName}</Description>
      <Url type="text/html" method="get" template="${url}${searchPath}"/>
      <Image height="16" width="16" type="image/jpeg">${url}/favicon.jpg</Image>
    </OpenSearchDescription>
  `;
    return c.body(xml, 200, { 'Content-Type': 'application/xml' });
  });
