import { combineResolvers } from 'graphql-resolvers';
import { discoverAndParseFeedFromUrl } from '../../../util/feeds';
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

  Mutation: {
    async createUserRemote(parent, { profile_url }, { currentUser, models }) {
      if (!currentUser) {
        // TODO(mime): return to login.
        return;
      }

      const { feedMeta } = await discoverAndParseFeedFromUrl(profile_url);

      const parsedUrl = new URL(profile_url);
      await models.User_Remote.upsert({
        local_username: currentUser.model.username,
        username: feedMeta['atom:author']?.['poco:preferredusername']['#'] || feedMeta.title || profile_url,
        name: feedMeta.author || feedMeta['atom:author']?.['poco:displayname'] || '',
        profile_url,
        salmon_url:
          feedMeta['atom:link'] &&
          [].concat(feedMeta['atom:link']).find(link => link['@'].rel === 'salmon')?.['@'].href,
        feed_url: feedMeta.xmlurl,
        hub_url: feedMeta.cloud?.type === 'hub' ? feedMeta.cloud.href : undefined,
        avatar: feedMeta.image?.url,
        favicon: feedMeta.favicon || `${parsedUrl.origin}/favicon.ico`,
        following: true,
      });

      return await models.User_Remote.findOne({ where: { local_username: currentUser.model.username, profile_url } });
    },
  },
};
