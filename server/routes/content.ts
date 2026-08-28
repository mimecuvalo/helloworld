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
    assertAdmin(ctx);
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
  .get('/editable', zValidator('query', z.object({ name: z.string() })), async (c) => {
    const ctx = c.get('ctx');
    assertAuthor(ctx);
    return c.json(await content.fetchEditableContent(ctx, c.req.valid('query')));
  })
  .post(
    '/save',
    zValidator(
      'json',
      z.object({
        name: z.string(),
        title: z.string(),
        hidden: z.boolean(),
        view: z.string(),
        newName: z.string().optional(),
        section: z.string().optional(),
        album: z.string().optional(),
        template: z.string().optional(),
        thumb: z.string().optional(),
        style: z.string().optional(),
        code: z.string().optional(),
      })
    ),
    async (c) => {
      const ctx = c.get('ctx');
      assertAuthor(ctx);
      const result = await content.saveContent(ctx, c.req.valid('json'));
      // A rejected rename or move is the author's problem to fix, not a bug:
      // hand back which rule it tripped so the editor can say so.
      return 'error' in result ? c.json(result, 409) : c.json(result);
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
        template: z.string().optional(),
      })
    ),
    async (c) => {
      const ctx = c.get('ctx');
      assertAuthor(ctx);
      const result = await content.postContent(ctx, c.req.valid('json'));
      return 'error' in result ? c.json(result, 409) : c.json(result);
    }
  )
  .post(
    '/container',
    zValidator(
      'json',
      z.object({ kind: z.enum(['section', 'album']), title: z.string(), section: z.string().optional() })
    ),
    async (c) => {
      const ctx = c.get('ctx');
      assertAuthor(ctx);
      const result = await content.createContainer(ctx, c.req.valid('json'));
      return 'error' in result ? c.json(result, 409) : c.json(result);
    }
  )
  .post('/order', zValidator('json', z.object({ section: z.string(), names: z.array(z.string()) })), async (c) => {
    const ctx = c.get('ctx');
    assertAuthor(ctx);
    const result = await content.orderContent(ctx, c.req.valid('json'));
    // The names sent no longer describe the group they were dragged in: the
    // sitemap the author was looking at is out of date, so say so rather than
    // renumbering rows they never saw.
    return 'error' in result ? c.json(result, 409) : c.json(result);
  })
  .post('/delete', zValidator('json', z.object({ name: z.string() })), async (c) => {
    const ctx = c.get('ctx');
    assertAuthor(ctx);
    return c.json(await content.deleteContent(ctx, c.req.valid('json')));
  });
