// import socialButterfly from 'social-butterfly';
import {
  ContentResolvers,
  Content as ContentType,
  MutationDeleteContentArgs,
  MutationPostContentArgs,
  MutationSaveContentArgs,
  QueryFetchCollectionArgs,
  QueryFetchCollectionLatestArgs,
  QueryFetchCollectionPaginatedArgs,
  QueryFetchContentArgs,
  QueryFetchContentHeadArgs,
  QueryFetchContentNeighborsArgs,
  QueryFetchSiteMapArgs,
} from 'data/graphql-generated';
import { isAdmin, isAuthor } from './authorization';

import { Context } from 'data/context';
import cheerio from 'cheerio';
import { combineResolvers } from 'graphql-resolvers';
import { isRobotViewing } from 'util/crawler';
import { nanoid } from 'nanoid';

const ATTRIBUTES_NAVIGATION = {
  username: true,
  section: true,
  album: true,
  name: true,
  title: true,
  thumb: true,
  hidden: true,
  template: true,
  style: true,
  code: true,
};

const Content = {
  Query: {
    // eslint-disable-next-line
    allContent: combineResolvers(isAdmin, async (parent: ContentResolvers, args: any, { prisma }: Context) => {
      return await prisma.content.findMany();
    }),

    async fetchContent(
      parent: ContentResolvers,
      { username, name }: QueryFetchContentArgs,
      { currentUsername, hostname, prisma, req }: Context
    ) {
      username = username || undefined;
      name = name || undefined;

      if (!username) {
        if (hostname) {
          const hostnameUserData = await prisma.user.findUnique({ select: { username: true }, where: { hostname } });
          if (hostnameUserData) {
            username = hostnameUserData.username;
            name = name || 'home';
          }
        }
        if (!username) {
          username = (await prisma.user.findUnique({ select: { username: true }, where: { id: 1 } }))?.username;
          name = name || 'main';
        }
      }

      let content = (await prisma.content.findFirst({ where: { username, name } })) as ContentType | null;

      if (!content) {
        name = 'home';
        // Could be that we don't have a 'main' page. Look for a 'home' page instead.
        content = (await prisma.content.findFirst({ where: { username, name } })) as ContentType | null;
      }

      // Inherit style, code, template from the album.
      if (content?.album && content.album !== 'main') {
        const albumContent = await prisma.content.findFirst({
          where: { username, section: content.section, album: 'main', name: content.album },
        });
        if (albumContent?.style) {
          content.style = albumContent.style + content.style;
        }
        if (albumContent?.code) {
          content.code = albumContent.code + content.code;
        }
      }

      // Inherit style, code, template from section.
      if (content && content?.section !== 'main') {
        const sectionContent = await prisma.content.findFirst({
          where: { username, section: 'main', name: content.section },
        });
        if (sectionContent?.style) {
          content.style = sectionContent.style + content.style;
        }
        if (sectionContent?.code) {
          content.code = sectionContent.code + content.code;
        }
        if (!content.template && content.album === 'main') {
          content.template = sectionContent?.template || '';
        }
      }
      if (content && !content.template && content.album === 'main') {
        // This is when we're visiting a url of the form: /profile/section/album
        const parentContent = await prisma.content.findFirst({
          where: { username, section: 'main', name: content.section },
        });
        content.template = parentContent?.template || '';
      }

      // Update count
      // lack of 'req' is a dumb check for !fetchContentHead :-/
      const isOwnerViewing = currentUsername === username;
      if (req && content && !isOwnerViewing) {
        const attributes = isRobotViewing(req) ? { count_robot: content.countRobot + 1 } : { count: content.count + 1 };
        await prisma.content.update({
          data: attributes,
          where: {
            username_name: {
              username: username || '',
              name: content.name,
            },
          },
        });
      }

      if (!content) {
        return null;
      }

      return decorateWithRefreshFlag(content);
    },

    // XXX(mime): see HTMLHead.js :(
    async fetchContentHead(parent: ContentResolvers, { username, name }: QueryFetchContentHeadArgs, ctx: Context) {
      return await Content.Query.fetchContent(parent, { username, name }, ctx);
    },

    async fetchContentNeighbors(
      parent: ContentResolvers,
      { username, section, album, name }: QueryFetchContentNeighborsArgs,
      { currentUsername, prisma }: Context
    ) {
      const ATTRIBUTES_NAVIGATION_WITH_VIEW = Object.assign({ view: true }, ATTRIBUTES_NAVIGATION);

      if (!username) {
        username = (await prisma.user.findFirst({ select: { username: true }, where: { id: 1 } }))?.username;
      }
      name = name || 'main';
      album = album || undefined;
      section = section || undefined;

      const sectionContent = await prisma.content.findFirst({
        where: { username, section: 'main', name: section === 'main' ? name : section },
      });
      const orderBy = [{ order: 'asc' }, getSQLSortType(sectionContent?.sortType || '')];

      const isOwnerViewing = currentUsername === username;

      const constraints: { [key: string]: boolean | number } = {
        redirect: 0,
      };
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      const collectionConstraints = {
        username,
        section,
        album,
      };
      const collection = (await prisma.content.findMany({
        select: ATTRIBUTES_NAVIGATION_WITH_VIEW,
        where: Object.assign({}, constraints, collectionConstraints),
        orderBy,
      })) as ContentType[];

      const contentIndex = collection.findIndex((i) => i.name === name);

      const collectionItemConstraints = {
        username,
        section: !album ? 'main' : section,
        album: album ? 'main' : '',
        name: album ? album : section,
      };
      const collectionItem = await prisma.content.findFirst({
        select: ATTRIBUTES_NAVIGATION_WITH_VIEW,
        where: collectionItemConstraints,
      });
      console.log(ATTRIBUTES_NAVIGATION_WITH_VIEW, collectionItemConstraints);

      if (!collectionItem) {
        return null;
      }

      return {
        first: decorateWithRefreshFlag(collection[collection.length - 1]),
        prev: decoratePrefetchImages(decorateWithRefreshFlag(collection[contentIndex + 1])),
        top: decorateWithRefreshFlag(collectionItem as ContentType),
        next: decoratePrefetchImages(decorateWithRefreshFlag(collection[contentIndex - 1])),
        last: decorateWithRefreshFlag(collection[0]),
      };
    },

    async fetchCollection(
      parent: ContentResolvers,
      { username, section, album, name }: QueryFetchCollectionArgs,
      { currentUsername, prisma }: Context
    ) {
      const isOwnerViewing = currentUsername === username;

      const sectionContent = await prisma.content.findFirst({
        where: { username, section: !album ? 'main' : section, name },
      });
      const orderBy = [{ order: 'asc' }, getSQLSortType(sectionContent?.sortType || '')];

      const constraints: { [key: string]: boolean | number } = {
        redirect: 0,
      };
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      // For links section, we grab the anchor url in the view.
      const select = section === 'links' ? Object.assign({ view: true }, ATTRIBUTES_NAVIGATION) : ATTRIBUTES_NAVIGATION;

      let collection: ContentType[] = [];
      // Check first to see if this is an album and grab items within it.
      if (section !== 'main') {
        const contentConstraints = { username, section, album: name };
        collection = (await prisma.content.findMany({
          select,
          where: Object.assign({}, constraints, contentConstraints),
          orderBy,
        })) as ContentType[];
      }

      // If we couldn't find an album then, look for the section instead and find the albums within it.
      if (!collection.length) {
        const contentConstraints = { username, section: name, album: 'main' };
        collection = (await prisma.content.findMany({
          select,
          where: Object.assign({}, constraints, contentConstraints),
          orderBy,
        })) as ContentType[];

        const albumConstraints = Object.assign({}, constraints, contentConstraints);
        for (const content of collection) {
          albumConstraints['album'] = content.name;
          const albumFirstContent = await prisma.content.findFirst({
            select: { thumb: true },
            where: Object.assign({}, constraints, albumConstraints),
            orderBy,
          });
          if (albumFirstContent) {
            content.thumb = albumFirstContent.thumb;
          }
        }

        // Then, it combines with top-level items in the section (not in an album).
        const topLevelContentConstraints = { username, section: name, album: '' };
        const topLevelItems = (await prisma.content.findMany({
          select,
          where: Object.assign({}, constraints, topLevelContentConstraints),
          orderBy,
        })) as ContentType[];
        collection = collection.concat(topLevelItems);
      }

      // This is if the top-level user page is an album. (I'm pretty sure at least :-/)
      if (!collection.length && section !== 'main') {
        const contentConstraints = { username, section };
        collection = (await prisma.content.findMany({
          select: ATTRIBUTES_NAVIGATION,
          where: Object.assign({}, constraints, contentConstraints),
          orderBy,
        })) as ContentType[];
      }

      if (section === 'links') {
        collection.forEach((item) => {
          const link = item.view.match(/https?:\/\/[^"']+/);
          const youTubeMatch = link?.[0].match(/youtube.com\/embed\/([^?<]+)/);
          const youTubeSeriesMatch = link?.[0].match(/youtube.com\/embed\/videoseries\?list=([^?<]+)/);
          item.externalLink = youTubeSeriesMatch
            ? `https://www.youtube.com/playlist?list=${youTubeSeriesMatch[1]}`
            : youTubeMatch
            ? `https://youtu.be/${youTubeMatch[1]}`
            : link?.[0];
        });
      }

      return decorateArrayWithRefreshFlag(collection);
    },

    async fetchCollectionPaginated(
      parent: ContentResolvers,
      { username, section, name, offset }: QueryFetchCollectionPaginatedArgs,
      { currentUsername, prisma }: Context
    ) {
      const isOwnerViewing = currentUsername === username;
      const take = 20;

      const constraints: { [key: string]: boolean | number } = {
        redirect: 0,
      };
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      const notEqualToMain = { not: 'main' };
      const contentConstraints = {
        username,
        section: section !== 'main' ? section : name !== 'home' ? name : notEqualToMain,
        album: section !== 'main' ? name : notEqualToMain,
      };
      return await prisma.content.findMany({
        where: Object.assign({}, constraints, contentConstraints),
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        take,
        skip: offset * take,
      });
    },

    async fetchCollectionLatest(
      parent: ContentResolvers,
      { username, name }: QueryFetchCollectionLatestArgs,
      { currentUsername, prisma }: Context
    ) {
      const isOwnerViewing = currentUsername === username;

      const constraints: { [key: string]: boolean | number } = {
        redirect: 0,
      };
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      const contentConstraints = { username, section: name };
      return await prisma.content.findFirst({
        where: Object.assign({}, constraints, contentConstraints),
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      });
    },

    async fetchSiteMap(
      parent: ContentResolvers,
      { username }: QueryFetchSiteMapArgs,
      { currentUsername, prisma }: Context
    ) {
      const isOwnerViewing = currentUsername === username;
      const constraints: { [key: string]: boolean } = {};
      if (!isOwnerViewing) {
        constraints['hidden'] = false;
      }

      const contentConstraints = {
        username,
        section: 'main',
        name: { notIn: ['main', 'home', 'comments'] },
        redirect: 0,
      };

      const sections = (await prisma.content.findMany({
        select: ATTRIBUTES_NAVIGATION,
        where: Object.assign({}, constraints, contentConstraints),
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      })) as ContentType[];

      let siteMap: ContentType[] = [];
      for (const section of sections) {
        const albumConstraints = {
          username,
          section: section.name,
          album: 'main',
        };

        const albums = (await prisma.content.findMany({
          select: ATTRIBUTES_NAVIGATION,
          where: Object.assign({}, constraints, albumConstraints),
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        })) as ContentType[];

        siteMap.push(section);
        if (albums.length) {
          siteMap = siteMap.concat(albums);
        }
      }

      return decorateArrayWithRefreshFlag(siteMap);
    },

    // TODO: re-enable
    // async searchContent(parent: ContentResolvers, { username, query }: QuerySearchContentArgs, {currentUsername, prisma }: Context) {
    //   const isOwnerViewing = currentUsername === username;

    //   const constraints: {[key: string]: boolean | string | number} = {
    //     redirect: 0,
    //     username,
    //   };
    //   if (!isOwnerViewing) {
    //     constraints['hidden'] = false;
    //   }

    //   let collection = await prisma.content.findMany({
    //     select: Object.assign({view: true}, ATTRIBUTES_NAVIGATION),
    //     where: [constraints, Sequelize.literal('match (title, view) against (:query)')],
    //     replacements: {
    //       query,
    //     },
    //   });

    //   for (const item of collection) {
    //     const HTML_REGEX = /<[^>]+>/g;
    //     item.preview = ellipsize(item.view.replace(HTML_REGEX, '').trim(), 130);
    //   }

    //   return decorateArrayWithRefreshFlag(collection);
    // },
  },

  Mutation: {
    saveContent: combineResolvers(
      isAuthor,
      async (
        parent: ContentResolvers,
        { name, hidden, title, thumb, style, code, content }: MutationSaveContentArgs,
        { currentUsername, prisma }: Context
      ) => {
        const username = currentUsername;
        const view = 'FIXME';
        const thread = discoverThreadInHTML(view);

        await prisma.content.update({
          data: {
            hidden,
            title,
            thumb,
            style,
            thread,
            code,
            content,
            view,
          },
          where: {
            username_name: {
              username,
              name,
            },
          },
        });

        // const updatedContent = await prisma.content.findOne({ where: { username, name } });

        if (!hidden) {
          // // TODO(mime): hacky - how can we unify this (here and wherever we use syndicate())
          // currentUser.model.url = profileUrl(currentUsername, req);
          // updatedContent.url = contentUrl(updatedContent, req);
          // await socialButterfly().syndicate(req, currentUser.model, updatedContent);
        }

        return { username: currentUsername, name, hidden, title, thumb, style, code, content };
      }
    ),

    postContent: combineResolvers(
      isAuthor,
      async (
        parent: ContentResolvers,
        { section, album, name, title, hidden, thumb, style, code, content }: MutationPostContentArgs,
        { currentUsername }: Context
      ) => {
        name = (name || 'untitled') + '-' + nanoid(10);
        name = name.replace(/[^A-Za-z0-9-]/, '-');

        // const view = 'FIXME';
        // const thread = discoverThreadInHTML(view);

        // const createdContent = await prisma.content.create({
        //   username: currentUsername,
        //   section,
        //   album,
        //   name,
        //   title,
        //   thumb,
        //   thread,
        //   hidden,
        //   style,
        //   code,
        //   content,
        //   view,
        // });

        if (!hidden) {
          // // TODO(mime): hacky - how can we unify this (here and wherever we use syndicate())
          // currentUser.model.url = profileUrl(currentUsername, req);
          // createdContent.url = contentUrl(createdContent, req);
          // await socialButterfly().syndicate(req, currentUsername, createdContent);
        }

        return {
          username: currentUsername,
          section,
          album,
          name,
          title,
          hidden,
          thumb,
          style,
          code,
          content,
        };
      }
    ),

    deleteContent: combineResolvers(
      isAuthor,
      async (parent: ContentResolvers, { name }: MutationDeleteContentArgs, { currentUsername, prisma }: Context) => {
        await prisma.content.delete({
          where: {
            username_name: {
              username: currentUsername,
              name,
            },
          },
        });
        return true;
      }
    ),
  },
};

export default Content;

function discoverThreadInHTML(html: string) {
  const $ = cheerio.load(html);
  return $('a.u-in-reply-to').first().attr('href');
}

function getSQLSortType(sortType: string): { [key: string]: string } {
  if (sortType === 'oldest') {
    return { createdAt: 'asc' };
  }
  if (sortType === 'alphabetical') {
    return { title: 'asc' };
  }
  return { createdAt: 'desc' };
}

function decorateArrayWithRefreshFlag(list: ContentType[]) {
  for (const item of list) {
    decorateWithRefreshFlag(item);
  }

  return list;
}

function decorateWithRefreshFlag(item: ContentType) {
  if (item) {
    item.forceRefresh = !!(item.style || item.code);
  }

  return item;
}

function decoratePrefetchImages(item: ContentType) {
  if (item) {
    item.prefetchImages = (item.view.match(/src=['"][^'"]+['"]/g) || []).map((i) => i.slice(5, -1));
  }

  return item;
}

// function ellipsize(str: string, len: number) {
//   if (str.length <= len) {
//     return str;
//   }

//   return str.slice(0, len) + '…';
// }
