import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { assertAuthor } from '../authorization';
import * as media from '../services/media';

// A selection is a few dozen tiles at the very worst, and each carries up to
// three keys. The cap is what keeps the usage query's OR list finite.
const keys = z.object({ keys: z.array(z.string().max(1024)).min(1).max(300) });

export const mediaRoutes = new Hono<AppEnv>()
  .get('/list', zValidator('query', z.object({ prefix: z.string().max(1024).optional() })), async (c) => {
    const ctx = c.get('ctx');
    assertAuthor(ctx);

    const prefix = media.ownPrefix(ctx.currentUser!.username, c.req.valid('query').prefix);
    return c.json(await media.listMedia(prefix));
  })
  // What a delete is about to break, asked before it happens rather than
  // discovered afterwards in a post with a hole in it.
  .post('/usage', zValidator('json', keys), async (c) => {
    const ctx = c.get('ctx');
    assertAuthor(ctx);

    return c.json({ usage: await media.findUsage(ctx, c.req.valid('json').keys) });
  })
  .post('/delete', zValidator('json', keys), async (c) => {
    const ctx = c.get('ctx');
    assertAuthor(ctx);

    // The client sends every size it means to remove, because it is also what
    // showed the author that list before they confirmed it.
    return c.json(await media.deleteMedia(ctx, c.req.valid('json').keys));
  });
