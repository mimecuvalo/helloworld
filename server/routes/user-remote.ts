import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { assertAdmin, assertAuthor } from '../authorization';
import * as svc from '../services/user-remote';

export const userRemoteRoutes = new Hono<AppEnv>()
  .get('/followers', async (c) => {
    const ctx = c.get('ctx');
    await assertAuthor(ctx);
    return c.json(await svc.fetchFollowers(ctx));
  })
  .get('/following', async (c) => {
    const ctx = c.get('ctx');
    await assertAuthor(ctx);
    return c.json(await svc.fetchFollowing(ctx));
  })
  .get('/all', async (c) => {
    const ctx = c.get('ctx');
    await assertAdmin(ctx);
    return c.json(await svc.allUsersRemote(ctx));
  })
  .get('/:id', zValidator('param', z.object({ id: z.coerce.number().int() })), async (c) => {
    const ctx = c.get('ctx');
    await assertAdmin(ctx);
    return c.json(await svc.fetchUserRemote(ctx, c.req.valid('param').id));
  })
  .post(
    '/toggle-sort-feed',
    zValidator('json', z.object({ profileUrl: z.string(), currentSortType: z.string() })),
    async (c) => {
      const ctx = c.get('ctx');
      await assertAuthor(ctx);
      return c.json(await svc.toggleSortFeed(ctx, c.req.valid('json')));
    }
  )
  .post('/follow', zValidator('json', z.object({ profileUrl: z.string() })), async (c) => {
    const ctx = c.get('ctx');
    await assertAuthor(ctx);
    return c.json(await svc.createUserRemote(ctx, c.req.valid('json')));
  })
  .post('/unfollow', zValidator('json', z.object({ profileUrl: z.string() })), async (c) => {
    const ctx = c.get('ctx');
    await assertAuthor(ctx);
    return c.json(await svc.destroyFeed(ctx, c.req.valid('json')));
  });
