import { csrf } from 'hono/csrf';
import type { MiddlewareHandler } from 'hono';

// Origin/Sec-Fetch-based CSRF protection for state-changing requests.
//
// hono's csrf() only rejects a cross-site request when its Content-Type is one
// an HTML form can produce (urlencoded / multipart / text) — those are the only
// requests a malicious page can forge without a CORS preflight. JSON RPC calls
// (application/json) therefore pass through untouched but remain safe, because a
// cross-origin page can't send them without CORS consent.
//
// `skip` lets machine-to-machine endpoints opt out (e.g. federation inboxes /
// WebMention, which are legitimately cross-origin form POSTs authenticated by
// signatures/secrets rather than by same-origin).
export function createCsrfMiddleware(options?: { skip?: (path: string) => boolean }): MiddlewareHandler {
  const middleware = csrf();
  return (c, next) => {
    if (options?.skip?.(c.req.path)) return next();
    return middleware(c, next);
  };
}
