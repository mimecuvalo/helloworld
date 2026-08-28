import type { Context } from './context';

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export function assertAuthenticated(ctx: Context): void {
  if (!ctx.user || !ctx.user.email) {
    throw new UnauthorizedError('Not logged in.');
  }
}

// These used to re-SELECT the whole User row — every column, secrets included —
// by email on each call, and a single request calls them more than once (the
// route asserts, then the service beneath it asserts again). createContext has
// already resolved the session email to a row, so they're assertions over
// context now rather than queries.
export function assertAuthor(ctx: Context): void {
  assertAuthenticated(ctx);

  if (!ctx.currentUser) {
    throw new ForbiddenError('I call shenanigans.');
  }
}

export function assertAdmin(ctx: Context): void {
  assertAuthenticated(ctx);

  if (!ctx.currentUser?.superuser) {
    throw new ForbiddenError('I call shenanigans.');
  }
}
