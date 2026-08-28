import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { assertAdmin } from '../authorization';
import * as userService from '../services/user';
import { exportUserData } from '../services/export';

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
    assertAdmin(ctx);
    return c.json(await userService.fetchAllUsers(ctx));
  })

  // Profile editing and data liberation. The service asserts authorship.
  .get('/profile', (c) => c.json(userService.fetchProfile(c.get('ctx'))))
  .post(
    '/profile',
    zValidator(
      'json',
      z.object({
        name: z.string().min(1).max(200),
        title: z.string().max(200),
        description: z.string().max(2000).nullable().optional(),
        favicon: z.string().max(2000).nullable().optional(),
        logo: z.string().max(2000).nullable().optional(),
        license: z.string().max(200).nullable().optional(),
        theme: z.string().max(50),
      })
    ),
    async (c) => c.json(await userService.updateProfile(c.get('ctx'), c.req.valid('json')))
  )
  .get('/export', async (c) => {
    const { filename, bytes } = await exportUserData(c.get('ctx'));
    const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return c.body(body, 200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // Your own data, assembled per request: never anything a cache should keep.
      'Cache-Control': 'no-store, private',
    });
  })

  // Bluesky account linking. The service asserts authorship on each of these.
  .get('/atproto', async (c) => c.json(await userService.fetchAtprotoStatus(c.get('ctx'))))
  .post(
    '/atproto',
    zValidator(
      'json',
      z.object({ handle: z.string().min(1), appPassword: z.string().optional(), pdsUrl: z.string().url().optional() })
    ),
    async (c) => c.json(await userService.linkAtprotoAccount(c.get('ctx'), c.req.valid('json')))
  )
  .delete('/atproto', async (c) => c.json(await userService.unlinkAtprotoAccount(c.get('ctx'))))

  // Mastodon rel="me" verification — no credential, just a URL to link back to.
  .get('/mastodon', async (c) => c.json(await userService.fetchMastodonStatus(c.get('ctx'))))
  .post('/mastodon', zValidator('json', z.object({ mastodonUrl: z.string().min(1) })), async (c) =>
    c.json(await userService.linkMastodonAccount(c.get('ctx'), c.req.valid('json')))
  )
  .delete('/mastodon', async (c) => c.json(await userService.unlinkMastodonAccount(c.get('ctx'))))

  // Registered before /:id: that route coerces the param to a number, so it
  // would reject "atproto" with a 400 rather than falling through.
  .get('/:id', zValidator('param', z.object({ id: z.coerce.number().int() })), async (c) => {
    const ctx = c.get('ctx');
    assertAdmin(ctx);
    return c.json(await userService.fetchUser(ctx, c.req.valid('param').id));
  })
  .post('/', zValidator('json', z.object({ username: z.string(), email: z.string().email() })), async (c) => {
    const ctx = c.get('ctx');
    assertAdmin(ctx);
    return c.json(await userService.createUser(ctx, c.req.valid('json')));
  });
