import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';

export default {
  Query: {
    allUsers: combineResolvers(
      isAdmin,
      async (parent, args, { models }) => {
        return await models.Content_Remote.findAll();
      }
    ),

    fetchUser: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        return await models.Content_Remote.findById(id);
      }
    ),
  },
};
