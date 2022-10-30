import {
  MutationCreateUserArgs,
  QueryFetchPublicUserDataArgs,
  QueryFetchPublicUserDataSearchArgs,
  QueryFetchUserArgs,
  UserPrivate,
  UserPrivateResolvers,
  UserPublicResolvers,
} from 'data/graphql-generated';

import { Context } from 'data/context';
import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';

const User = {
  Query: {
    // eslint-disable-next-line
    currentUser: async (parent: UserPrivateResolvers, args: any, { currentUser }: Context) => {
      return currentUser;
    },

    // eslint-disable-next-line
    fetchAllUsers: combineResolvers(isAdmin, async (parent: UserPrivateResolvers, args: any, { prisma }: Context) => {
      return await prisma.user.findMany();
    }),

    fetchUser: combineResolvers(
      isAdmin,
      async (parent: UserPrivateResolvers, { id }: QueryFetchUserArgs, { loaders }: Context) => {
        return ((await loaders.users.load(id)) as UserPrivate[])[0];
      }
    ),

    async fetchPublicUserData(
      parent: UserPublicResolvers,
      { username }: QueryFetchPublicUserDataArgs,
      { hostname, prisma }: Context
    ) {
      if (hostname) {
        const hostnameUserData = await prisma.user.findFirst({ select: { username: true }, where: { hostname } });
        if (hostnameUserData) {
          username = hostnameUserData.username;
        }
      }

      if (!username) {
        username = (await prisma.user.findUnique({ select: { username: true }, where: { id: 1 } }))?.username;
      }

      return await prisma.user.findUnique({
        select: {
          username: true,
          name: true,
          title: true,
          email: true,
          description: true,
          license: true,
          googleAnalytics: true,
          favicon: true,
          logo: true,
          theme: true,
          viewport: true,
          sidebarHtml: true,
        },
        where: { username },
      });
    },

    // XXX(mime): might not need this anymore?
    async fetchPublicUserDataSearch(
      parent: UserPublicResolvers,
      { username }: QueryFetchPublicUserDataSearchArgs,
      ctx: Context
    ) {
      return await User.Query.fetchPublicUserData(parent, { username }, ctx);
    },
  },

  Mutation: {
    createUser: combineResolvers(
      isAdmin,
      async (parent: UserPrivateResolvers, { username, email }: MutationCreateUserArgs, { prisma }: Context) => {
        return await prisma.user.create({
          data: { username, email, name: '', title: '', theme: '', magicKey: '', privateKey: '' },
        });
      }
    ),
  },
};

export default User;
