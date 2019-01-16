import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';

export default {
  Query: {
    allUsers: combineResolvers(
      isAdmin,
      async (parent, args, { models }) => {
        return await models.User.findAll();
      }
    ),

    fetchUser: combineResolvers(
      isAdmin,
      async (parent, { id }, { models }) => {
        return await models.User.findById(id);
      }
    ),
  },

  // Example stubs of mutations, non-functional out of the box.
  Mutation: {
    createUser: combineResolvers(
      isAdmin,
      async (parent, { username, email }, { models }) => {
        return await models.User.create({ username, email });
      }
    )
  },
};
