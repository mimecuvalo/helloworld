import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { assertAdmin, assertAuthenticated, assertAuthor } from '../authorization';
import * as cr from '../services/content-remote';

const usernameName = z.object({ username: z.string().optional(), name: z.string().optional() });

export const contentRemoteRoutes = new Hono<AppEnv>()
  .get('/all', async (c) => {
    const ctx = c.get('ctx');
    assertAdmin(ctx);
    return c.json(await cr.allContentRemote(ctx));
  })
  .get(
    '/paginated',
    zValidator(
      'query',
      z
        .object({
          profileUrlOrSpecialFeed: z.string(),
          cursorCreatedAt: z.iso.datetime().optional(),
          cursorId: z.coerce.number().int().optional(),
          shouldShowAllItems: z
            .string()
            .optional()
            .transform((v) => v === 'true'),
        })
        // Half a cursor would silently paginate from the top again; reject it
        // at the boundary rather than quietly serving page 1.
        .refine((v) => (v.cursorCreatedAt === undefined) === (v.cursorId === undefined), {
          message: 'cursorCreatedAt and cursorId must be sent together',
        })
    ),
    async (c) => {
      const ctx = c.get('ctx');
      assertAuthor(ctx);
      return c.json(await cr.fetchContentRemotePaginated(ctx, c.req.valid('query')));
    }
  )
  .get('/counts', async (c) => {
    const ctx = c.get('ctx');
    assertAuthor(ctx);
    return c.json(await cr.fetchCounts(ctx));
  })
  .get('/comments', zValidator('query', usernameName), async (c) =>
    c.json(await cr.fetchCommentsRemote(c.get('ctx'), c.req.valid('query')))
  )
  .get('/favorites', zValidator('query', usernameName), async (c) =>
    c.json(await cr.fetchFavoritesRemote(c.get('ctx'), c.req.valid('query')))
  )
  .post(
    '/repost',
    zValidator('json', z.object({ fromUsername: z.string(), postId: z.string(), isRepost: z.boolean() })),
    async (c) => {
      const ctx = c.get('ctx');
      assertAuthor(ctx);
      return c.json(await cr.repostContentRemote(ctx, c.req.valid('json')));
    }
  )
  .get('/:id', zValidator('param', z.object({ id: z.coerce.number().int() })), async (c) => {
    const ctx = c.get('ctx');
    assertAdmin(ctx);
    return c.json(await cr.fetchContentRemote(ctx, c.req.valid('param').id));
  })
  .post(
    '/comment',
    zValidator('json', z.object({ username: z.string(), name: z.string(), content: z.string() })),
    async (c) => {
      const ctx = c.get('ctx');
      assertAuthenticated(ctx);
      return c.json(await cr.postComment(ctx, c.req.valid('json')));
    }
  )
  .post(
    '/favorite',
    zValidator(
      'json',
      z.object({ fromUsername: z.string(), postId: z.string(), type: z.string(), favorited: z.boolean() })
    ),
    async (c) => {
      const ctx = c.get('ctx');
      assertAuthor(ctx);
      return c.json(await cr.favoriteContentRemote(ctx, c.req.valid('json')));
    }
  )
  .post(
    '/delete',
    zValidator(
      'json',
      z.object({
        fromUsername: z.string(),
        postId: z.string(),
        localContentName: z.string(),
        type: z.string(),
        deleted: z.boolean(),
      })
    ),
    async (c) => {
      const ctx = c.get('ctx');
      assertAuthor(ctx);
      return c.json(await cr.deleteContentRemote(ctx, c.req.valid('json')));
    }
  )
  .post('/mark-feed-read', zValidator('json', z.object({ fromUsername: z.string() })), async (c) => {
    const ctx = c.get('ctx');
    assertAuthor(ctx);
    return c.json(await cr.markAllContentInFeedAsRead(ctx, c.req.valid('json')));
  })
  .post('/mark-all-read', async (c) => {
    const ctx = c.get('ctx');
    assertAuthor(ctx);
    return c.json(await cr.markAllFeedsAsRead(ctx));
  })
  .post(
    '/read-batch',
    zValidator(
      'json',
      z.object({
        read: z.boolean(),
        items: z
          .array(z.object({ fromUsername: z.string(), postId: z.string() }))
          .min(1)
          .max(cr.READ_BATCH_MAX),
      })
    ),
    async (c) => {
      const ctx = c.get('ctx');
      assertAuthor(ctx);
      return c.json(await cr.readContentRemoteBatch(ctx, c.req.valid('json')));
    }
  );
