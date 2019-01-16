import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';

export default {
  Query: {
    allContentRemote: combineResolvers(
      isAdmin,
      async (parent, args, { models }) => {
        return await models.Content_Remote.findAll();
      }
    ),

    fetchContentRemote: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        return await models.Content_Remote.findById(id);
      }
    ),
  },
};
