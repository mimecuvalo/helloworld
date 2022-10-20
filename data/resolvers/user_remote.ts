import {
  CreateUserRemoteMutationVariables,
  DestroyFeedMutationVariables,
  QueryFetchUserRemoteArgs,
  ToggleSortFeedMutationVariables,
  UserRemotePrivateResolvers,
} from 'data/graphql-generated';
import { isAdmin, isAuthor } from './authorization';

import { Context } from 'data/context';
import { combineResolvers } from 'graphql-resolvers';
import socialButterfly from 'social-butterfly';

const UserRemote = {
  Query: {
    // eslint-disable-next-line
    allUsersRemote: combineResolvers(
      isAdmin,
      async (parent: UserRemotePrivateResolvers, args: any, { prisma }: Context) => {
        return await prisma.userRemote.findMany();
      }
    ),

    fetchUserRemote: combineResolvers(
      isAdmin,
      async (parent: UserRemotePrivateResolvers, { id }: QueryFetchUserRemoteArgs, { prisma }: Context) => {
        return await prisma.userRemote.findUnique({ where: { id } });
      }
    ),

    // eslint-disable-next-line
    async fetchFollowers(parent: UserRemotePrivateResolvers, args: any, { currentUsername, prisma }: Context) {
      return await prisma.userRemote.findMany({
        select: {
          username: true,
          name: true,
          profileUrl: true,
          avatar: true,
          favicon: true,
          sortType: true,
          following: true,
        },
        where: { localUsername: currentUsername, follower: true },
        orderBy: { username: 'asc' },
      });
    },

    // eslint-disable-next-line
    async fetchFollowing(parent: UserRemotePrivateResolvers, args: any, { currentUsername, prisma }: Context) {
      return await prisma.userRemote.findMany({
        select: { username: true, name: true, profileUrl: true, avatar: true, favicon: true, sortType: true },
        where: { localUsername: currentUsername, following: true },
        orderBy: [{ order: 'asc' }, { username: 'asc' }],
      });
    },
  },

  Mutation: {
    createUserRemote: combineResolvers(
      isAuthor,
      async (
        parent: UserRemotePrivateResolvers,
        { profileUrl }: CreateUserRemoteMutationVariables,
        { currentUsername, req }: Context
      ) => {
        return await socialButterfly().follow(req, currentUsername, profileUrl);
      }
    ),

    toggleSortFeed: combineResolvers(
      isAuthor,
      async (
        parent: UserRemotePrivateResolvers,
        { profileUrl, currentSortType }: ToggleSortFeedMutationVariables,
        { currentUsername, prisma }: Context
      ) => {
        const sortType = currentSortType === 'oldest' ? '' : 'oldest';
        await prisma.userRemote.update({
          data: {
            sortType,
          },
          where: {
            localUsername_profileUrl: {
              localUsername: currentUsername,
              profileUrl,
            },
          },
        });

        return { profileUrl, sortType };
      }
    ),

    destroyFeed: combineResolvers(
      isAuthor,
      async (
        parent: UserRemotePrivateResolvers,
        { profileUrl }: DestroyFeedMutationVariables,
        { currentUsername, prisma, req }: Context
      ) => {
        const userRemote = await prisma.userRemote.findUnique({
          where: { localUsername_profileUrl: { localUsername: currentUsername, profileUrl } },
        });

        if (!userRemote) {
          return false;
        }

        if (!userRemote.follower) {
          // The user isn't following us. Remove them altogether.
          await prisma.userRemote.delete({ where: { id: userRemote.id } });
        } else {
          // The user is following us. Keep them around.
          await prisma.userRemote.update({ data: { following: false }, where: { id: userRemote.id } });
        }

        await socialButterfly().unfollow(req, currentUsername, userRemote, userRemote.hubUrl, profileUrl);

        return true;
      }
    ),
  },
};
export default UserRemote;
