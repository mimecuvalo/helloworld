import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';

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
};
