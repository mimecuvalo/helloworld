import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';
import Sequelize from 'sequelize';

export default {
  Query: {
    allContentRemote: combineResolvers(isAdmin, async (parent, args, { models }) => {
      return await models.Content_Remote.findAll();
    }),

    fetchContentRemote: combineResolvers(isAdmin, async (parent, { id }, { models }) => {
      return await models.Content_Remote.findById(id);
    }),

    async fetchContentRemotePaginated(parent, { profileUrlOrSpecialFeed, offset, query }, { currentUser, models }) {
      if (!currentUser) {
        // TODO(mime): return to login.
        return;
      }

      const limit = 20;

      let constraints = {
        to_username: currentUser.model.username,
        deleted: false,
        is_spam: false,
      };

      switch (profileUrlOrSpecialFeed) {
        case 'favorites':
          constraints.favorited = true;
          break;
        case 'comments':
          constraints.type = 'comment';
          break;
        default:
          if (profileUrlOrSpecialFeed) {
            constraints.from_user = profileUrlOrSpecialFeed;
          }
          constraints.type = 'post';
          constraints.read = false;
          break;
      }

      let replacements;
      if (query) {
        constraints = [constraints, Sequelize.literal('match (title, view) against (:query)')];
        replacements = { query };
      }

      return await models.Content_Remote.findAll({
        where: constraints,
        order: [['createdAt', 'DESC']],
        limit,
        offset: offset * limit,
        replacements,
      });
    },

    async fetchUserTotalCounts(parent, args, { currentUser, models }) {
      if (!currentUser) {
        // TODO(mime): return to login.
        return;
      }

      const commonConstraints = {
        to_username: currentUser.model.username,
        deleted: false,
        is_spam: false,
      };

      const commentsCount = await models.Content_Remote.count({
        where: Object.assign({}, commonConstraints, { type: 'comment' }),
      });

      const favoritesCount = await models.Content_Remote.count({
        where: Object.assign({}, commonConstraints, { favorited: true }),
      });

      const totalCount = await models.Content_Remote.count({
        where: Object.assign({}, commonConstraints, { type: 'post', read: false }),
      });

      return {
        commentsCount,
        favoritesCount,
        totalCount,
      };
    },

    async fetchFeedCounts(parent, args, { currentUser, models }) {
      if (!currentUser) {
        // TODO(mime): return to login.
        return;
      }

      const result = await models.Content_Remote.findAll({
        attributes: ['from_user', [Sequelize.fn('COUNT', '*'), 'count']],
        where: {
          to_username: currentUser.model.username,
          deleted: false,
          is_spam: false,
          read: false,
          type: 'post',
        },
        group: ['from_user'],
      });

      result.forEach(item => {
        item.count = item.get('count');
      }); // hrmph.

      return result;
    },
  },

  Mutation: {
    async favoriteContentRemote(parent, { from_user, post_id, favorited }, { currentUser, models }) {
      if (!currentUser) {
        // TODO(mime): return to login.
        return false;
      }

      await models.Content_Remote.update(
        {
          favorited,
        },
        {
          where: {
            to_username: currentUser.model.username,
            from_user,
            post_id,
          },
        }
      );

      return { from_user, post_id, favorited };
    },

    async markAllContentInFeedAsRead(parent, { from_user }, { currentUser, models }) {
      if (!currentUser) {
        // TODO(mime): return to login.
        return false;
      }

      await models.Content_Remote.update(
        {
          read: true,
        },
        {
          where: {
            to_username: currentUser.model.username,
            from_user,
          },
        }
      );

      return true;
    },
  },
};
