import { Context } from 'data/context';
import { skip } from 'graphql-resolvers';

export const isAuthenticated = (parent: unknown, args: unknown, ctx: Context) => {
  if (!ctx.user) {
    throw new Error(`Not logged in.`);
  }

  return skip;
};

export const isAdmin = async (parent: unknown, args: unknown, ctx: Context) => {
  if (!ctx.user) {
    throw new Error(`Not logged in.`);
  }

  const user = await ctx.prisma.user.findUnique({
    where: {
      email: ctx.user.email,
    },
  });

  if (!user || user.role !== 'ADMIN') {
    throw new Error(`I call shenanigans.`);
  }

  return skip;
};
