import { combineResolvers } from 'graphql-resolvers';
import { isAdmin, isAuthor } from './authorization';
import Sequelize from 'sequelize';

export default {
  Query: {
    allContentRemote: combineResolvers(isAdmin, async (parent, args, { models }) => {
      return await models.Content_Remote.findAll();
    }),

    fetchContentRemote: combineResolvers(isAdmin, async (parent, { id }, { models }) => {
      return await models.Content_Remote.findById(id);
    }),

    fetchContentRemotePaginated: combineResolvers(
      isAuthor,
      async (parent, { profileUrlOrSpecialFeed, offset, query, shouldShowAllItems }, { currentUser, models }) => {
        const limit = 20;

        let constraints = {
          to_username: currentUser.model.username,
          deleted: false,
          is_spam: false,
        };
        let order = 'DESC';

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
              const userRemote = await models.User_Remote.findOne({
                attributes: ['sort_type'],
                where: { local_username: currentUser.model.username, profile_url: profileUrlOrSpecialFeed },
              });
              if (userRemote.sort_type === 'oldest') {
                order = 'ASC';
              }
            }
            constraints.type = 'post';
            if (!shouldShowAllItems) {
              constraints.read = false;
            }
            break;
        }

        let replacements;
        if (query) {
          constraints = [constraints, Sequelize.literal('match (title, view) against (:query)')];
          replacements = { query };
        }

        return await models.Content_Remote.findAll({
          where: constraints,
          order: [['createdAt', order]],
          limit,
          offset: offset * limit,
          replacements,
        });
      }
    ),

    fetchUserTotalCounts: combineResolvers(isAuthor, async (parent, args, { currentUser, models }) => {
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
    }),

    fetchFeedCounts: combineResolvers(isAuthor, async (parent, args, { currentUser, models }) => {
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
    }),

    fetchCommentsRemote: combineResolvers(isAuthor, async (parent, { username, name }, { models }) => {
      const result = await models.Content_Remote.findAll({
        attributes: ['avatar', 'from_user', 'link', 'post_id', 'username', 'view'],
        where: {
          to_username: username,
          local_content_name: name,
          deleted: false,
          is_spam: false,
          read: false,
          type: 'comment',
        },
        order: [['createdAt', 'DESC']],
      });

      return result;
    }),

    fetchFavoritesRemote: combineResolvers(isAuthor, async (parent, { username, name }, { models }) => {
      const result = await models.Content_Remote.findAll({
        attributes: ['avatar', 'from_user', 'username'],
        where: {
          to_username: username,
          local_content_name: name,
          deleted: false,
          is_spam: false,
          read: false,
          type: 'favorite',
        },
        order: [['createdAt', 'DESC']],
      });

      return result;
    }),
  },

  Mutation: {
    favoriteContentRemote: combineResolvers(
      isAuthor,
      async (parent, { from_user, post_id, favorited }, { currentUser, models }) => {
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
      }
    ),

    markAllContentInFeedAsRead: combineResolvers(isAuthor, async (parent, { from_user }, { currentUser, models }) => {
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

      return { from_user, count: 0 };
    }),

    readContentRemote: combineResolvers(
      isAuthor,
      async (parent, { from_user, post_id, read }, { currentUser, models }) => {
        await models.Content_Remote.update(
          {
            read,
          },
          {
            where: {
              to_username: currentUser.model.username,
              from_user,
              post_id,
            },
          }
        );

        return { from_user, post_id, read };
      }
    ),
  },
};
