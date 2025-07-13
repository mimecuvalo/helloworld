import {
  CreateUserRemoteMutationVariables,
  DestroyFeedMutationVariables,
  QueryFetchUserRemoteArgs,
  ToggleSortFeedMutationVariables,
  UserRemotePrivateResolvers,
} from 'data/graphql-generated';
import { follow, unfollow } from 'app/api/social/follow';
import { isAdmin, isAuthor } from './authorization';

import { Context } from 'data/context';
import { User } from '@prisma/client';
import { combineResolvers } from 'graphql-resolvers';

const UserRemote = {
  Query: {
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
        { currentUser, req }: Context
      ) => {
        return await follow(req, currentUser as User, profileUrl);
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
        { currentUsername, currentUser, prisma, req }: Context
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

        await unfollow(req, currentUser as User, userRemote, userRemote.hubUrl, profileUrl);

        return true;
      }
    ),
  },
};
export default UserRemote;
