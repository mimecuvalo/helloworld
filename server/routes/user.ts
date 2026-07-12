import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { assertAdmin } from '../authorization';
import * as userService from '../services/user';

export const userRoutes = new Hono<AppEnv>()
  .get('/current', (c) => c.json(userService.currentUser(c.get('ctx'))))
  .get('/public', zValidator('query', z.object({ username: z.string().optional() })), async (c) =>
    c.json(await userService.fetchPublicUserData(c.get('ctx'), c.req.valid('query').username))
  )
  .get('/public-search', zValidator('query', z.object({ username: z.string().optional() })), async (c) =>
    c.json(await userService.fetchPublicUserDataSearch(c.get('ctx'), c.req.valid('query').username))
  )
  .get('/all', async (c) => {
    const ctx = c.get('ctx');
    await assertAdmin(ctx);
    return c.json(await userService.fetchAllUsers(ctx));
  })
  .get('/:id', zValidator('param', z.object({ id: z.coerce.number().int() })), async (c) => {
    const ctx = c.get('ctx');
    await assertAdmin(ctx);
    return c.json(await userService.fetchUser(ctx, c.req.valid('param').id));
  })
  .post('/', zValidator('json', z.object({ username: z.string(), email: z.string().email() })), async (c) => {
    const ctx = c.get('ctx');
    await assertAdmin(ctx);
    return c.json(await userService.createUser(ctx, c.req.valid('json')));
  });
