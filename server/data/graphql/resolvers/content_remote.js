import { contentUrl, profileUrl } from 'shared/util/url_factory';
import { isAdmin, isAuthor } from './authorization';

import Sequelize from 'sequelize';
import { combineResolvers } from 'graphql-resolvers';
import crypto from 'crypto';
import socialButterfly from 'server/social-butterfly';
import { toHTML } from './content';
import { v4 as uuidv4 } from 'uuid';

const contentRemote = {
  ContentRemote: {
    __resolveType(contentRemote, context, info) {
      return contentRemote.type[0].toUpperCase() + contentRemote.type.slice(1);
    },
  },

  Query: {
    allContentRemote: combineResolvers(isAdmin, async (parent, args, { models }) => {
      return await models.Content_Remote.findAll();
    }),

    fetchContentRemote: combineResolvers(isAdmin, async (parent, { id }, { models }) => {
      return await models.Content_Remote.findByPk(id);
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

        let results = await models.Content_Remote.findAll({
          where: constraints,
          order: [['createdAt', order]],
          limit,
          offset: offset * limit,
          replacements,
        });

        // So, a funny UI behavior quirk of having an infinite RSS feed that has the user scrolling while
        // marking things as read as this messes with your offset limits. Set offset to 0 if we found no results
        // the first time.
        if (!results.length && offset !== 0) {
          results = await models.Content_Remote.findAll({
            where: constraints,
            order: [['createdAt', order]],
            limit,
            offset: 0,
            replacements,
          });
        }
        return results;
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

      result.forEach((item) => {
        item.count = item.get('count');
      }); // hrmph.

      return result;
    }),

    async fetchCommentsRemote(parent, { username, name }, { models }) {
      const result = await models.Content_Remote.findAll({
        attributes: [
          'avatar',
          'creator',
          'content',
          'createdAt',
          'deleted',
          'favorited',
          'from_user',
          'link',
          'local_content_name',
          'post_id',
          'type',
          'username',
          'view',
        ],
        where: {
          to_username: username,
          local_content_name: name,
          deleted: false,
          is_spam: false,
          type: 'comment',
        },
        order: [['createdAt', 'DESC']],
      });

      return result;
    },

    async fetchFavoritesRemote(parent, { username, name }, { models }) {
      const result = await models.Content_Remote.findAll({
        attributes: ['avatar', 'createdAt', 'from_user', 'local_content_name', 'post_id', 'type', 'username'],
        where: {
          to_username: username,
          local_content_name: name,
          deleted: false,
          is_spam: false,
          type: 'favorite',
        },
        order: [['createdAt', 'DESC']],
      });

      return result;
    },
  },

  Mutation: {
    postComment: async (parent, { username, name, content }, { currentUser, models, req }) => {
      const localUrl = `/${username}/remote-comments/comment-${uuidv4()}`;
      const tagDate = new Date().toISOString().slice(0, 10);
      const post_id = `tag:${req.get('host')},${tagDate}:${localUrl}`;
      const protocol = req.get('x-scheme') || req.protocol;
      const link = `${protocol}://${req.get('host')}${localUrl}`;

      const userInfo = currentUser.oauth;
      const commentUsername = userInfo.email.split('@')[0];
      const md5 = crypto.createHash('md5');
      const emailHash = md5.update(`mailto:${userInfo.email}`).digest('hex');
      const gravatar = `http://www.gravatar.com/avatar/${emailHash}`;
      const avatar = userInfo.picture || gravatar;

      const createdRemoteContent = await models.Content_Remote.create({
        avatar,
        comment_user: userInfo.email,
        content,
        from_user: null,
        link,
        local_content_name: name,
        post_id,
        title: '',
        to_username: username,
        type: 'comment',
        username: commentUsername,
        view: toHTML(content),
      });

      const commentedContent = await models.Content.findOne({
        attributes: ['id', 'comments_count'],
        where: { username, name },
      });
      await models.Content.update(
        {
          comments_count: commentedContent.comments_count + 1,
          comments_updated: new Date(),
        },
        { where: { id: commentedContent.id } }
      );
      const updatedCommentedContent = await models.Content.findOne({ where: { id: commentedContent.id } });
      const contentOwner = await models.User.findOne({ where: { username } });

      if (!commentedContent.hidden) {
        // TODO(mime): hacky - how can we unify this (here and wherever we use syndicate())
        contentOwner.url = profileUrl(contentOwner.username, req);
        updatedCommentedContent.url = contentUrl(updatedCommentedContent, req);

        await socialButterfly().syndicate(
          req,
          contentOwner,
          updatedCommentedContent,
          createdRemoteContent,
          true /* isComment */
        );
      }

      return {
        avatar,
        content,
        deleted: false,
        favorited: false,
        from_user: null,
        link,
        local_content_name: name,
        post_id,
        to_username: username,
        type: 'comment',
        username: commentUsername,
      };
    },

    favoriteContentRemote: combineResolvers(
      isAuthor,
      async (parent, { from_user, post_id, type, favorited }, { currentUser, models, req }) => {
        const remoteContentWhere = {
          to_username: currentUser.model.username,
          from_user,
          post_id,
        };
        await models.Content_Remote.update({ favorited }, { where: remoteContentWhere });
        const contentRemote = await models.Content_Remote.findOne({ where: remoteContentWhere });
        const userRemote = await models.User_Remote.findOne({
          where: {
            local_username: currentUser.model.username,
            profile_url: contentRemote.from_user,
          },
        });

        // TODO(mime): hacky - how can we unify this (here and wherever we use syndicate())
        currentUser.model.url = profileUrl(currentUser.model.username, req);
        socialButterfly().like(req, currentUser.model, contentRemote, userRemote, favorited);

        return { from_user, post_id, type, favorited };
      }
    ),

    deleteContentRemote: combineResolvers(
      isAuthor,
      async (parent, { from_user, post_id, local_content_name, type, deleted }, { currentUser, models }) => {
        const where = {
          to_username: currentUser.model.username,
          from_user,
          post_id,
        };
        await models.Content_Remote.update({ deleted }, { where });

        const localContentWhere = { username: currentUser.model.username, name: local_content_name };
        const commentedContent = await models.Content.findOne({
          attributes: ['comments_count'],
          where: localContentWhere,
        });
        await models.Content.update(
          {
            comments_count: commentedContent.comments_count + (deleted ? -1 : 1),
          },
          { where: localContentWhere }
        );

        return { from_user, post_id, local_content_name, type, deleted };
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

    markAllFeedsAsRead: combineResolvers(isAuthor, async (parent, variables, { currentUser, models }) => {
      await models.Content_Remote.update({ read: true }, { where: { to_username: currentUser.model.username } });
      return { count: 0 };
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

export default contentRemote;
