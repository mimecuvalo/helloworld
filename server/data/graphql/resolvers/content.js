import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';
import Sequelize from 'sequelize';

const ATTRIBUTES_NAVIGATION = ['username', 'section', 'album', 'name', 'title', 'thumb', 'hidden'];

export default {
  Query: {
    allContent: combineResolvers(isAdmin, async (parent, args, { models }) => {
      return await models.Content.findAll();
    }),

    async fetchContent(parent, { username, name }, { models }) {
      if (!username) {
        username = (await models.User.findOne({ attributes: ['username'], where: { id: 1 } })).username;
      }
      name = name || 'main';

      const content = await models.Content.findOne({ where: { username, name } });
      if (content && !content.template && content.album === 'main') {
        // This is when we're visiting a url of the form: /profile/section/album
        const parentContent = await models.Content.findOne({
          where: { username, section: 'main', name: content.section },
        });
        content.template = parentContent.template;
      }

      return content;
    },

    async fetchContentNeighbors(parent, { username, section, album, name }, { currentUser, models }) {
      if (!username) {
        username = (await models.User.findOne({ attributes: ['username'], where: { id: 1 } })).username;
      }
      name = name || 'main';

      const isOwnerViewing = currentUser && currentUser.model.username === username;

      const constraints = {
        redirect: false,
      };
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      const collectionConstraints = {
        username,
        section,
        album,
      };
      const collection = await models.Content.findAll({
        attributes: ATTRIBUTES_NAVIGATION,
        where: Object.assign({}, constraints, collectionConstraints),
        order: [['order'], ['date_created', 'DESC']],
      });

      const contentIndex = collection.findIndex(i => i.name === name);

      const collectionItemConstraints = {
        username,
        section: !album ? 'main' : section,
        album: album ? 'main' : '',
        name: album ? album : section,
      };
      const collectionItem = await models.Content.findOne({
        attributes: ATTRIBUTES_NAVIGATION,
        where: collectionItemConstraints,
      });

      return {
        first: collection[collection.length - 1],
        prev: collection[contentIndex + 1],
        top: collectionItem,
        next: collection[contentIndex - 1],
        last: collection[0],
      };
    },

    async fetchCollection(parent, { username, section, name }, { currentUser, models }) {
      const isOwnerViewing = currentUser && currentUser.model.username === username;

      const constraints = {
        redirect: false,
      };
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      let collection = [];
      if (section !== 'main') {
        const contentConstraints = { username, section, album: name };
        collection = await models.Content.findAll({
          attributes: ATTRIBUTES_NAVIGATION,
          where: Object.assign({}, constraints, contentConstraints),
          order: [['order'], ['date_created', 'DESC']],
        });
      }

      if (!collection.length) {
        const contentConstraints = { username, section: name, album: 'main' };
        collection = await models.Content.findAll({
          attributes: ATTRIBUTES_NAVIGATION,
          where: Object.assign({}, constraints, contentConstraints),
          order: [['order'], ['date_created', 'DESC']],
        });

        const albumConstraints = Object.assign({}, constraints, contentConstraints);
        for (const content of collection) {
          albumConstraints['album'] = content.name;
          const albumFirstContent = await models.Content.findOne({
            attributes: ['thumb'],
            where: Object.assign({}, constraints, albumConstraints),
            order: [['order'], ['date_created', 'DESC']],
          });
          if (albumFirstContent) {
            content.thumb = albumFirstContent.thumb;
          }
        }

        // Then, it combines with top-level items (not in an album)
        const topLevelContentConstraints = { username, section: name, album: '' };
        const topLevelItems = await models.Content.findAll({
          attributes: ATTRIBUTES_NAVIGATION,
          where: Object.assign({}, constraints, topLevelContentConstraints),
          order: [['order'], ['date_created', 'DESC']],
        });
        collection = collection.concat(topLevelItems);
      }

      if (!collection.length && section !== 'main') {
        const contentConstraints = { username, section };
        collection = await models.Content.findAll({
          attributes: ATTRIBUTES_NAVIGATION,
          where: Object.assign({}, constraints, contentConstraints),
          order: [['order'], ['date_created', 'DESC']],
        });
      }

      return collection;
    },

    async fetchCollectionPaginated(parent, { username, section, name }, { currentUser, models }) {
      const isOwnerViewing = currentUser && currentUser.model.username === username;
      const limit = 20; // TODO(mime)
      const offset = 0; // TODO(mime)

      const constraints = {
        redirect: false,
      };
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      const notEqualToMain = { [Sequelize.Op.ne]: 'main' };
      const contentConstraints = {
        username,
        section: section !== 'main' ? section : name !== 'home' ? name : notEqualToMain,
        album: section !== 'main' ? name : notEqualToMain,
      };
      return await models.Content.findAll({
        where: Object.assign({}, constraints, contentConstraints),
        order: [['order'], ['date_created', 'DESC']],
        limit,
        offset,
      });
    },

    async fetchCollectionLatest(parent, { username, section, name }, { currentUser, models }) {
      const isOwnerViewing = currentUser && currentUser.model.username === username;

      const constraints = {
        redirect: false,
      };
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      const contentConstraints = { username, section: name };
      return await models.Content.findOne({
        where: Object.assign({}, constraints, contentConstraints),
        order: [['order'], ['date_created', 'DESC']],
      });
    },

    async fetchSiteMap(parent, { username }, { currentUser, models }) {
      const isOwnerViewing = currentUser && currentUser.model.username === username;
      const constraints = {};
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      const contentConstraints = {
        username,
        section: 'main',
        name: { [Sequelize.Op.notIn]: ['main', 'home', 'comments'] },
      };

      const sections = await models.Content.findAll({
        attributes: ATTRIBUTES_NAVIGATION,
        where: Object.assign({}, constraints, contentConstraints),
        order: [['order'], ['date_created']],
      });

      let siteMap = [];
      for (const section of sections) {
        const albumConstraints = {
          username,
          section: section.name,
          album: 'main',
        };

        const albums = await models.Content.findAll({
          attributes: ATTRIBUTES_NAVIGATION,
          where: Object.assign({}, constraints, albumConstraints),
          order: [['order'], ['date_created']],
        });

        siteMap.push(section);
        if (albums.length) {
          siteMap = siteMap.concat(albums);
        }
      }

      return siteMap;
    },
  },
};
