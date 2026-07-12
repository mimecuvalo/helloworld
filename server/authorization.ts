import type { Context } from './context';

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export function assertAuthenticated(ctx: Context): void {
  if (!ctx.user || !ctx.user.email) {
    throw new UnauthorizedError('Not logged in.');
  }
}

export async function assertAuthor(ctx: Context): Promise<void> {
  assertAuthenticated(ctx);

  const user = await ctx.prisma.user.findUnique({ where: { email: ctx.user!.email! } });
  if (!user) {
    throw new ForbiddenError('I call shenanigans.');
  }
}

export async function assertAdmin(ctx: Context): Promise<void> {
  assertAuthenticated(ctx);

  const user = await ctx.prisma.user.findUnique({
    where: { email: ctx.user!.email! },
  });

  if (!user || !user.superuser) {
    throw new ForbiddenError('I call shenanigans.');
  }
}
