import { combineResolvers } from 'graphql-resolvers';
import { isAdmin } from './authorization';
import Sequelize from 'sequelize';

const ATTRIBUTES_NAVIGATION = [
  'username',
  'section',
  'album',
  'name',
  'title',
  'thumb',
  'hidden',
  'template',
  'style',
  'code',
];

export default {
  Query: {
    allContent: combineResolvers(isAdmin, async (parent, args, { models }) => {
      return await models.Content.findAll();
    }),

    async fetchContent(parent, { username, name }, { hostname, models }) {
      if (!username) {
        if (hostname) {
          const hostnameUserData = await models.User.findOne({ attributes: ['username'], where: { hostname } });
          if (hostnameUserData) {
            username = hostnameUserData.username;
            name = name || 'home';
          }
        }
        if (!username) {
          username = (await models.User.findOne({ attributes: ['username'], where: { id: 1 } })).username;
          name = name || 'main';
        }
      }

      const content = await models.Content.findOne({ where: { username, name } });

      // Inherit style, code, template from the album.
      if (content?.album && content.album !== 'main') {
        const albumContent = await models.Content.findOne({
          where: { username, section: content.section, album: 'main', name: content.album },
        });
        if (albumContent.style) {
          content.style = albumContent.style + content.style;
        }
        if (albumContent.code) {
          content.code = albumContent.code + content.code;
        }
      }

      // Inherit style, code, template from section.
      if (content && content?.section !== 'main') {
        const sectionContent = await models.Content.findOne({
          where: { username, section: 'main', name: content.section },
        });
        if (sectionContent.style) {
          content.style = sectionContent.style + content.style;
        }
        if (sectionContent.code) {
          content.code = sectionContent.code + content.code;
        }
        if (!content.template && content.album === 'main') {
          content.template = sectionContent.template;
        }
      }
      if (content && !content.template && content.album === 'main') {
        // This is when we're visiting a url of the form: /profile/section/album
        const parentContent = await models.Content.findOne({
          where: { username, section: 'main', name: content.section },
        });
        content.template = parentContent.template;
      }

      return decorateWithRefreshFlag(content);
    },

    async fetchContentNeighbors(parent, { username, section, album, name }, { currentUser, models }) {
      const ATTRIBUTES_NAVIGATION_WITH_VIEW = ATTRIBUTES_NAVIGATION.concat(['view']);

      if (!username) {
        username = (await models.User.findOne({ attributes: ['username'], where: { id: 1 } })).username;
      }
      name = name || 'main';

      const sectionContent = await models.Content.findOne({
        where: { username, section: 'main', name: section === 'main' ? name : section },
      });
      const order = [['order'], getSQLSortType(sectionContent.sort_type)];

      const isOwnerViewing = currentUser?.model?.username === username;

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
        attributes: ATTRIBUTES_NAVIGATION_WITH_VIEW,
        where: Object.assign({}, constraints, collectionConstraints),
        order,
      });

      const contentIndex = collection.findIndex(i => i.name === name);

      const collectionItemConstraints = {
        username,
        section: !album ? 'main' : section,
        album: album ? 'main' : '',
        name: album ? album : section,
      };
      const collectionItem = await models.Content.findOne({
        attributes: ATTRIBUTES_NAVIGATION_WITH_VIEW,
        where: collectionItemConstraints,
      });

      return {
        first: decorateWithRefreshFlag(collection[collection.length - 1]),
        prev: decoratePrefetchImages(decorateWithRefreshFlag(collection[contentIndex + 1])),
        top: decorateWithRefreshFlag(collectionItem),
        next: decoratePrefetchImages(decorateWithRefreshFlag(collection[contentIndex - 1])),
        last: decorateWithRefreshFlag(collection[0]),
      };
    },

    async fetchCollection(parent, { username, section, album, name }, { currentUser, models }) {
      const isOwnerViewing = currentUser?.model?.username === username;

      const sectionContent = await models.Content.findOne({
        where: { username, section: !album ? 'main' : section, name },
      });
      const order = [['order'], getSQLSortType(sectionContent.sort_type)];

      const constraints = {
        redirect: false,
      };
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      let collection = [];
      // Check first to see if this is an album and grab items within it.
      if (section !== 'main') {
        const contentConstraints = { username, section, album: name };
        collection = await models.Content.findAll({
          attributes: ATTRIBUTES_NAVIGATION,
          where: Object.assign({}, constraints, contentConstraints),
          order,
        });
      }

      // If we couldn't find an album then, look for the section instead and find the albums within it.
      if (!collection.length) {
        const contentConstraints = { username, section: name, album: 'main' };
        collection = await models.Content.findAll({
          attributes: ATTRIBUTES_NAVIGATION,
          where: Object.assign({}, constraints, contentConstraints),
          order,
        });

        const albumConstraints = Object.assign({}, constraints, contentConstraints);
        for (const content of collection) {
          albumConstraints['album'] = content.name;
          const albumFirstContent = await models.Content.findOne({
            attributes: ['thumb'],
            where: Object.assign({}, constraints, albumConstraints),
            order,
          });
          if (albumFirstContent) {
            content.thumb = albumFirstContent.thumb;
          }
        }

        // Then, it combines with top-level items in the section (not in an album).
        const topLevelContentConstraints = { username, section: name, album: '' };
        const topLevelItems = await models.Content.findAll({
          attributes: ATTRIBUTES_NAVIGATION,
          where: Object.assign({}, constraints, topLevelContentConstraints),
          order,
        });
        collection = collection.concat(topLevelItems);
      }

      // This is if the top-level user page is an album. (I'm pretty sure at least :-/)
      if (!collection.length && section !== 'main') {
        const contentConstraints = { username, section };
        collection = await models.Content.findAll({
          attributes: ATTRIBUTES_NAVIGATION,
          where: Object.assign({}, constraints, contentConstraints),
          order,
        });
      }

      return decorateArrayWithRefreshFlag(collection);
    },

    async fetchCollectionPaginated(parent, { username, section, name }, { currentUser, models }) {
      const isOwnerViewing = currentUser?.model?.username === username;
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
        order: [['order'], ['createdAt', 'DESC']],
        limit,
        offset,
      });
    },

    async fetchFeed(parent, { username }, { models }) {
      const notEqualToMain = { [Sequelize.Op.ne]: 'main' };
      const contentConstraints = {
        username,
        section: notEqualToMain,
        album: notEqualToMain,
        hidden: false,
        redirect: false,
      };
      return await models.Content.findAll({
        where: contentConstraints,
        order: [['createdAt', 'DESC']],
        limit: 50,
      });
    },

    async fetchCollectionLatest(parent, { username, section, name }, { currentUser, models }) {
      const isOwnerViewing = currentUser?.model?.username === username;

      const constraints = {
        redirect: false,
      };
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      const contentConstraints = { username, section: name };
      return await models.Content.findOne({
        where: Object.assign({}, constraints, contentConstraints),
        order: [['order'], ['createdAt', 'DESC']],
      });
    },

    async fetchSiteMap(parent, { username }, { currentUser, models }) {
      const isOwnerViewing = currentUser?.model?.username === username;
      const constraints = {};
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      const contentConstraints = {
        username,
        section: 'main',
        name: { [Sequelize.Op.notIn]: ['main', 'home', 'comments'] },
        redirect: 0,
      };

      const sections = await models.Content.findAll({
        attributes: ATTRIBUTES_NAVIGATION,
        where: Object.assign({}, constraints, contentConstraints),
        order: [['order'], ['createdAt']],
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
          order: [['order'], ['createdAt']],
        });

        siteMap.push(section);
        if (albums.length) {
          siteMap = siteMap.concat(albums);
        }
      }

      return decorateArrayWithRefreshFlag(siteMap);
    },

    async searchContent(parent, { username, query }, { currentUser, models }) {
      const isOwnerViewing = currentUser?.model?.username === username;

      const constraints = {
        redirect: false,
        username,
      };
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      let collection = await models.Content.findAll({
        attributes: ATTRIBUTES_NAVIGATION.concat(['view']),
        where: [constraints, Sequelize.literal('match (title, view) against (:query)')],
        replacements: {
          query,
        },
      });

      for (const item of collection) {
        const HTML_REGEX = /<[^>]+>/g;
        item.preview = ellipsize(item.view.replace(HTML_REGEX, '').trim(), 130);
      }

      return decorateArrayWithRefreshFlag(collection);
    },
  },
};

function getSQLSortType(sortType) {
  if (sortType === 'oldest') {
    return ['createdAt'];
  }
  if (sortType === 'alphabetical') {
    return ['title'];
  }
  return ['createdAt', 'DESC'];
}

function decorateArrayWithRefreshFlag(list) {
  for (const item of list) {
    decorateWithRefreshFlag(item);
  }

  return list;
}

function decorateWithRefreshFlag(item) {
  if (item) {
    item.forceRefresh = !!(item.style || item.code);
  }

  return item;
}

function decoratePrefetchImages(item) {
  if (item) {
    item.prefetchImages = (item.view.match(/src=['"][^'"]+['"]/g) || []).map(i => i.slice(5, -1));
  }

  return item;
}

function ellipsize(str, len) {
  if (str.length <= len) {
    return str;
  }

  return str.slice(0, len) + '…';
}
