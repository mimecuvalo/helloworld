import { combineResolvers } from 'graphql-resolvers';
import { isAdmin, isAuthor } from './authorization';
import { profileUrl } from '../../../../shared/util/url_factory';
import socialButterfly from '../../../social-butterfly';

const UserRemote = {
  Query: {
    allUsersRemote: combineResolvers(isAdmin, async (parent, args, { models }) => {
      return await models.User_Remote.findAll();
    }),

    fetchUserRemote: combineResolvers(isAdmin, async (parent, { id }, { models }) => {
      return await models.User_Remote.findByPk(id);
    }),

    async fetchFollowers(parent, args, { currentUser, models }) {
      return await models.User_Remote.findAll({
        attributes: ['username', 'name', 'profile_url', 'avatar', 'favicon', 'sort_type', 'following'],
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
    createUserRemote: combineResolvers(isAuthor, async (parent, { profile_url }, { currentUser, models, req }) => {
      // TODO(mime): hacky - how can we unify this (here and wherever we use syndicate())
      currentUser.model.url = profileUrl(currentUser.model.username, req);
      return await socialButterfly().follow(req, currentUser, profile_url);
    }),

    toggleSortFeed: combineResolvers(
      isAuthor,
      async (parent, { profile_url, current_sort_type }, { currentUser, models }) => {
        const sort_type = current_sort_type === 'oldest' ? '' : 'oldest';
        await models.User_Remote.update(
          {
            sort_type,
          },
          {
            where: {
              local_username: currentUser.model.username,
              profile_url,
            },
          }
        );

        return { profile_url, sort_type };
      }
    ),

    destroyFeed: combineResolvers(isAuthor, async (parent, { profile_url }, { currentUser, models, req }) => {
      const userRemote = await models.User_Remote.findOne({
        where: { local_username: currentUser.model.username, profile_url },
      });

      if (!userRemote.follower) {
        // The user isn't following us. Remove them altogether.
        await models.User_Remote.destroy({ where: { id: userRemote.id } });
      } else {
        // The user is following us. Keep them around.
        await models.User_Remote.update({ following: false }, { where: { id: userRemote.id } });
      }

      await socialButterfly().unfollow(req, currentUser, userRemote, userRemote.hub_url, profile_url);

      return true;
    }),
  },
};
export default UserRemote;