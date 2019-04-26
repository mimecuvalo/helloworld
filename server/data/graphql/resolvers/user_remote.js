import { combineResolvers } from 'graphql-resolvers';
import { followUser, unfollowUser } from '../../../api/social_butterfly/follow';
import { isAdmin, isAuthor } from './authorization';

export default {
  Query: {
    allUsersRemote: combineResolvers(isAdmin, async (parent, args, { models }) => {
      return await models.User_Remote.findAll();
    }),

    fetchUserRemote: combineResolvers(isAdmin, async (parent, { id }, { models }) => {
      return await models.User_Remote.findById(id);
    }),

    async fetchFollowers(parent, args, { currentUser, models }) {
      return await models.User_Remote.findAll({
        attributes: ['username', 'name', 'profile_url', 'avatar', 'favicon', 'sort_type'],
        where: { local_username: currentUser.model.username, follower: true },
        order: [['username']],
      });
    },

    async fetchFollowing(parent, args, { currentUser, models }) {
      return await models.User_Remote.findAll({
        attributes: ['username', 'name', 'profile_url', 'avatar', 'favicon', 'sort_type'],
        where: { local_username: currentUser.model.username, following: true },
        order: [['order'], ['username']],
      });
    },
  },

  Mutation: {
    createUserRemote: combineResolvers(isAuthor, async (parent, { profile_url }, { currentUser, models, req }) => {
      return await followUser(req, currentUser, profile_url);
    }),

    toggleSortFeed: combineResolvers(
      isAuthor,
      async (parent, { profile_url, current_sort_type }, { currentUser, models }) => {
        const sort_type = current_sort_type === 'oldest' ? '' : 'oldest';
        await models.User_Remote.update(
          {
            sort_type,
          },
          {
            where: {
              local_username: currentUser.model.username,
              profile_url,
            },
          }
        );

        return { profile_url, sort_type };
      }
    ),

    destroyFeed: combineResolvers(isAuthor, async (parent, { profile_url }, { currentUser, models, req }) => {
      await models.User_Remote.destroy({
        where: {
          local_username: currentUser.model.username,
          profile_url,
        },
      });

      await unfollowUser(req, currentUser, profile_url);

      return true;
    }),
  },
};
