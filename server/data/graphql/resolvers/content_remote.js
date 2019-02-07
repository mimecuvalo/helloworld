import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';

export default {
  Query: {
    allContentRemote: combineResolvers(isAdmin, async (parent, args, { models }) => {
      return await models.Content_Remote.findAll();
    }),

    fetchContentRemote: combineResolvers(isAdmin, async (parent, { id }, { models }) => {
      return await models.Content_Remote.findById(id);
    }),

    async fetchContentRemotePaginated(parent, args, { currentUser, models }) {
      if (!currentUser) {
        // TODO(mime): return to login.
        return;
      }

      const limit = 20; // TODO(mime)
      const offset = 1; // TODO(mime)

      const constraints = {
        to_username: currentUser.model.username,
      };

      return await models.Content_Remote.findAll({
        where: constraints,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });
    },
  },
};
