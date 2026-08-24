import { Hono } from 'hono';
import type { ErrorHandler } from 'hono';
import type { AppEnv } from './env';
import { authHandler } from './auth';
import { createCsrfMiddleware } from './csrf';
import { createContext } from './context';
import { ForbiddenError, UnauthorizedError } from './authorization';
import { HTTPError } from './exceptions';
import { miscRoutes } from './routes/misc';
import { userRoutes } from './routes/user';
import { userRemoteRoutes } from './routes/user-remote';
import { contentRoutes } from './routes/content';
import { contentRemoteRoutes } from './routes/content-remote';
import { uploadRoutes } from './routes/upload';
import { unfurlRoutes } from './routes/unfurl';
import { socialRoutes } from './routes/social';
import { atprotoRoutes } from './routes/atproto';

const app = new Hono<AppEnv>().basePath('/api');

app.all('/auth/*', (c) => authHandler(c.req.raw));

// CSRF protection for everything except the Auth.js routes (terminated above)
// and the federation surface under /api/social/* — ActivityPub inboxes, Salmon
// and especially WebMention are legitimate cross-origin POSTs (WebMention is
// form-encoded, so csrf() would otherwise reject it); they authenticate via
// HTTP signatures / secrets, not same-origin.
app.use(
  '*',
  createCsrfMiddleware({ skip: (path) => path.startsWith('/api/social') || path.startsWith('/api/atproto') })
);

app.use('*', async (c, next) => {
  c.set('ctx', await createContext(c.req.raw));
  await next();
});

export const handleError: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof UnauthorizedError) return c.json({ error: err.message }, 401);
  if (err instanceof ForbiddenError) return c.json({ error: err.message }, 403);
  if (err instanceof HTTPError) {
    console.error(err);
    return c.json({ error: err.message }, err.status >= 500 ? 502 : 404);
  }
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
};

app.onError(handleError);

const routes = app
  .route('/', miscRoutes)
  .route('/users', userRoutes)
  .route('/users-remote', userRemoteRoutes)
  .route('/content', contentRoutes)
  .route('/content-remote', contentRemoteRoutes)
  .route('/', uploadRoutes)
  .route('/', unfurlRoutes)
  .route('/social', socialRoutes)
  .route('/atproto', atprotoRoutes);

export type AppType = typeof routes;
export default app;
