import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';

export default {
  Query: {
    allContent: combineResolvers(
      isAdmin,
      async (parent, args, { models }) => {
        return await models.Content.findAll();
      }
    ),

    async fetchContent(parent, { username, name }, { models }) {
      return await models.Content.findOne({ where: { username, name } });
    },
  },
};
