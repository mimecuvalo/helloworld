import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { assertAdmin, assertAuthor } from '../authorization';
import * as content from '../services/content';

const usernameName = z.object({ username: z.string().optional(), name: z.string().optional() });

export const contentRoutes = new Hono<AppEnv>()
  .get('/all', async (c) => {
    const ctx = c.get('ctx');
    await assertAdmin(ctx);
    return c.json(await content.allContent(ctx));
  })
  .get('/neighbors', zValidator('query', usernameName), async (c) =>
    c.json(await content.fetchContentNeighbors(c.get('ctx'), c.req.valid('query')))
  )
  .get(
    '/collection',
    zValidator('query', z.object({ username: z.string(), section: z.string(), album: z.string(), name: z.string() })),
    async (c) => c.json(await content.fetchCollection(c.get('ctx'), c.req.valid('query')))
  )
  .get(
    '/collection-paginated',
    zValidator(
      'query',
      z.object({
        username: z.string(),
        section: z.string(),
        name: z.string(),
        offset: z.coerce.number().int().default(0),
      })
    ),
    async (c) => c.json(await content.fetchCollectionPaginated(c.get('ctx'), c.req.valid('query')))
  )
  .get(
    '/collection-latest',
    zValidator('query', z.object({ username: z.string(), section: z.string(), name: z.string() })),
    async (c) => c.json(await content.fetchCollectionLatest(c.get('ctx'), c.req.valid('query')))
  )
  .get('/sitemap', zValidator('query', z.object({ username: z.string() })), async (c) =>
    c.json(await content.fetchSiteMap(c.get('ctx'), c.req.valid('query')))
  )
  .get('/search', zValidator('query', z.object({ username: z.string(), query: z.string() })), async (c) =>
    c.json(await content.searchContent(c.get('ctx'), c.req.valid('query')))
  )
  .get('/', zValidator('query', usernameName), async (c) =>
    c.json(await content.fetchContent(c.get('ctx'), c.req.valid('query')))
  )
  .post(
    '/save',
    zValidator('json', z.object({ name: z.string(), title: z.string(), hidden: z.boolean(), view: z.string() })),
    async (c) => {
      const ctx = c.get('ctx');
      await assertAuthor(ctx);
      return c.json(await content.saveContent(ctx, c.req.valid('json')));
    }
  )
  .post(
    '/post',
    zValidator(
      'json',
      z.object({
        section: z.string(),
        album: z.string(),
        name: z.string(),
        title: z.string(),
        hidden: z.boolean(),
        thumb: z.string(),
        style: z.string(),
        code: z.string(),
        view: z.string(),
      })
    ),
    async (c) => {
      const ctx = c.get('ctx');
      await assertAuthor(ctx);
      return c.json(await content.postContent(ctx, c.req.valid('json')));
    }
  )
  .post('/delete', zValidator('json', z.object({ name: z.string() })), async (c) => {
    const ctx = c.get('ctx');
    await assertAuthor(ctx);
    return c.json(await content.deleteContent(ctx, c.req.valid('json')));
  });
