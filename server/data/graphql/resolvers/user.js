import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';

const User = {
  Query: {
    fetchAllUsers: combineResolvers(isAdmin, async (parent, args, { models }) => {
      return await models.User.findAll();
    }),

    fetchUser: combineResolvers(isAdmin, async (parent, { id }, { loaders, models }) => {
      return loaders.users.load(id);
    }),

    async fetchPublicUserData(parent, { username }, { hostname, models }) {
      if (hostname) {
        const hostnameUserData = await models.User.findOne({ attributes: ['username'], where: { hostname } });
        if (hostnameUserData) {
          username = hostnameUserData.username;
        }
      }

      if (!username) {
        username = (await models.User.findOne({ attributes: ['username'], where: { id: 1 } })).username;
      }

      return await models.User.findOne({
        attributes: [
          'username',
          'name',
          'title',
          'email',
          'description',
          'license',
          'google_analytics',
          'favicon',
          'logo',
          'theme',
          'viewport',
          'sidebar_html',
        ],
        where: { username },
      });
    },

    // XXX(mime): see HTMLHead.js :(
    async fetchPublicUserDataHead(parent, { username }, { hostname, models }) {
      return await User.Query.fetchPublicUserData(parent, { username }, { hostname, models });
    },
    // XXX(mime): see HTMLHead.js :(
    async fetchPublicUserDataSearch(parent, { username }, { hostname, models }) {
      return await User.Query.fetchPublicUserData(parent, { username }, { hostname, models });
    },
  },

  // Example stubs of mutations, non-functional out of the box.
  Mutation: {
    createUser: combineResolvers(isAdmin, async (parent, { username, email }, { models }) => {
      return await models.User.create({ username, email });
    }),
  },
};

export default User;
