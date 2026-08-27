import * as cheerio from 'cheerio';
import { nanoid } from 'nanoid';
import type { Context } from '../context';
import type { Content } from '../../generated/prisma/client';
import { isRobotViewing } from '../crawler';
import { syndicate, threadUserFor, unsyndicate } from '../social';

type DecoratedContent = Content & {
  forceRefresh?: boolean;
  prefetchImages?: string[] | null;
  externalLink?: string | null;
};

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

// KV cache for neighbors and collection (Vercel egress limits).
const customCache: { [key: string]: any } = {};

export function allContent(ctx: Context) {
  return ctx.prisma.content.findMany();
}

export async function fetchContent(ctx: Context, args: { username?: string | null; name?: string | null }) {
  const { currentUsername, hostname, prisma, request } = ctx;
  let username = args.username || undefined;
  let name = args.name || undefined;

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

  let content = (await prisma.content.findUnique({
    where: { username_name: { username: username || '', name: name || '' } },
  })) as DecoratedContent | null;

  if (!content) {
    name = 'home';
    content = (await prisma.content.findUnique({
      where: { username_name: { username: username || '', name: name || '' } },
    })) as DecoratedContent | null;
  }

  // Inherit style/code from the album.
  if (content?.album && content.album !== 'main') {
    const albumContent = await prisma.content.findFirst({
      where: { username, section: content.section, album: 'main', name: content.album },
    });
    if (albumContent?.style) content.style = albumContent.style + content.style;
    if (albumContent?.code) content.code = albumContent.code + content.code;
  }

  // Inherit style/code/template from the section.
  if (content && content.section !== 'main') {
    const sectionContent = await prisma.content.findFirst({
      where: { username, section: 'main', name: content.section },
    });
    if (sectionContent?.style) content.style = sectionContent.style + content.style;
    if (sectionContent?.code) content.code = sectionContent.code + content.code;
    if (!content.template && content.album === 'main') {
      content.template = sectionContent?.template || '';
    }
  }

  if (content && !content.template && content.album === 'main') {
    const parentContent = await prisma.content.findFirst({
      where: { username, section: 'main', name: content.section },
    });
    content.template = parentContent?.template || '';
  }

  // Update view count (skip when the owner is viewing).
  const isOwnerViewing = currentUsername === username;
  if (content && !isOwnerViewing) {
    const attributes = isRobotViewing(request) ? { countRobot: content.countRobot + 1 } : { count: content.count + 1 };
    await prisma.content.update({
      data: attributes,
      where: { username_name: { username: username || '', name: content.name } },
    });
  }

  if (!content) return null;

  return decorateWithRefreshFlag(content);
}

export async function fetchContentNeighbors(ctx: Context, args: { username?: string | null; name?: string | null }) {
  const { currentUsername, prisma } = ctx;
  const ATTRIBUTES_NAVIGATION_WITH_VIEW = Object.assign({ view: true }, ATTRIBUTES_NAVIGATION);
  const content = (await prisma.content.findUnique({
    where: { username_name: { username: args.username || '', name: args.name || '' } },
  })) as DecoratedContent | null;

  let username = args.username || undefined;
  if (!username) {
    username = (await prisma.user.findFirst({ select: { username: true }, where: { id: 1 } }))?.username;
  }

  const isOwnerViewing = currentUsername === username;
  const name = args.name || 'main';
  const album = content?.album || undefined;
  const section = content?.section || undefined;

  if (!section && !album) {
    return { first: null, prev: null, top: null, next: null, last: null };
  }

  const sectionContent = await prisma.content.findFirst({
    where: { username, section: 'main', name: section === 'main' ? name : section },
  });
  const orderBy = [{ order: 'asc' }, getSQLSortType(sectionContent?.sortType || '')] as any;

  const constraints: { [key: string]: boolean | number } = { redirect: 0 };
  if (!isOwnerViewing) constraints['hidden'] = false;

  const collectionConstraints = { username, section, album };
  let collection: DecoratedContent[] | null = null;
  const cacheKey = `neighbors-collection:${username}:${section}:${album}`;
  const cachedData = !isOwnerViewing && customCache[cacheKey];
  if (cachedData) collection = cachedData as DecoratedContent[];
  if (!collection) {
    collection = (await prisma.content.findMany({
      select: ATTRIBUTES_NAVIGATION_WITH_VIEW,
      where: Object.assign({}, constraints, collectionConstraints),
      orderBy,
    })) as unknown as DecoratedContent[];
    if (!isOwnerViewing) customCache[cacheKey] = collection;
  }

  const contentIndex = collection.findIndex((i) => i.name === name);

  const collectionItem = await prisma.content.findFirst({
    select: ATTRIBUTES_NAVIGATION_WITH_VIEW,
    where: {
      username,
      section: !album ? 'main' : section,
      album: album ? 'main' : '',
      name: album ? album : section,
    },
  });

  if (!collectionItem) return null;

  return {
    first: decorateWithRefreshFlag(collection[collection.length - 1]),
    prev: decoratePrefetchImages(decorateWithRefreshFlag(collection[contentIndex + 1])),
    top: decorateWithRefreshFlag(collectionItem as unknown as DecoratedContent),
    next: decoratePrefetchImages(decorateWithRefreshFlag(collection[contentIndex - 1])),
    last: decorateWithRefreshFlag(collection[0]),
  };
}

export async function fetchCollection(
  ctx: Context,
  args: { username: string; section: string; album: string; name: string }
) {
  const { currentUsername, prisma } = ctx;
  const { username, section, album, name } = args;
  const isOwnerViewing = currentUsername === username;
  const cacheKey = `${username}:${section}:${album}:${name}`;
  const cachedData = !isOwnerViewing && customCache[cacheKey];
  if (cachedData) return cachedData;

  const sectionContent = await prisma.content.findFirst({
    where: { username, section: !album ? 'main' : section, name },
  });
  const orderBy = [{ order: 'asc' }, getSQLSortType(sectionContent?.sortType || '')] as any;

  const constraints: { [key: string]: any } = { redirect: 0, template: { not: 'blank' } };
  if (!isOwnerViewing) constraints['hidden'] = false;

  const select =
    section === 'links' || section === 'photos'
      ? Object.assign({ view: true }, ATTRIBUTES_NAVIGATION)
      : ATTRIBUTES_NAVIGATION;

  let collection: DecoratedContent[] = [];
  if (section !== 'main') {
    collection = (await prisma.content.findMany({
      select,
      where: Object.assign({}, constraints, { username, section, album: name }),
      orderBy,
    })) as unknown as DecoratedContent[];
  }

  if (!collection.length) {
    const contentConstraints = { username, section: name, album: 'main' };
    collection = (await prisma.content.findMany({
      select,
      where: Object.assign({}, constraints, contentConstraints),
      orderBy,
    })) as unknown as DecoratedContent[];

    const albumConstraints: { [key: string]: any } = Object.assign({}, constraints, contentConstraints);
    for (const content of collection) {
      albumConstraints['album'] = content.name;
      const albumFirstContent = await prisma.content.findFirst({
        select: { thumb: true },
        where: albumConstraints,
        orderBy,
      });
      if (albumFirstContent) content.thumb = albumFirstContent.thumb;
    }

    const topLevelItems = (await prisma.content.findMany({
      select,
      where: Object.assign({}, constraints, { username, section: name, album: '' }),
      orderBy,
    })) as unknown as DecoratedContent[];
    collection = collection.concat(topLevelItems);
  }

  if (!collection.length && section !== 'main') {
    collection = (await prisma.content.findMany({
      select: ATTRIBUTES_NAVIGATION,
      where: Object.assign({}, constraints, { username, section }),
      orderBy,
    })) as unknown as DecoratedContent[];
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

  const decoratedCollection = decorateArrayWithPrefetchImages(decorateArrayWithRefreshFlag(collection));
  if (!isOwnerViewing) customCache[cacheKey] = decoratedCollection;
  return decoratedCollection;
}

export async function fetchCollectionPaginated(
  ctx: Context,
  args: { username: string; section: string; name: string; offset: number }
) {
  const { currentUsername, prisma } = ctx;
  const { username, section, name, offset } = args;
  const isOwnerViewing = currentUsername === username;
  const cacheKey = `paginatedCollection:${username}:${section}:${name}:${offset}`;
  const cachedData = !isOwnerViewing && customCache[cacheKey];
  if (cachedData) return cachedData;
  const take = 20;

  const constraints: { [key: string]: any } = { redirect: 0, template: { not: 'blank' } };
  if (!isOwnerViewing) constraints['hidden'] = false;

  const notEqualToMain = { not: 'main' };
  const contentConstraints = {
    username,
    section: section !== 'main' ? section : name !== 'home' ? name : notEqualToMain,
    album: section !== 'main' ? name : notEqualToMain,
  };
  const paginatedCollection = await prisma.content.findMany({
    where: Object.assign({}, constraints, contentConstraints),
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    take,
    skip: offset * take,
  });
  if (!isOwnerViewing) customCache[cacheKey] = paginatedCollection;
  return paginatedCollection;
}

export function fetchCollectionLatest(ctx: Context, args: { username: string; section: string; name: string }) {
  const { currentUsername, prisma } = ctx;
  const isOwnerViewing = currentUsername === args.username;
  const constraints: { [key: string]: boolean | number } = { redirect: 0 };
  if (!isOwnerViewing) constraints['hidden'] = false;

  return prisma.content.findFirst({
    where: Object.assign({}, constraints, { username: args.username, section: args.name }),
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
}

function ellipsize(str: string, len: number) {
  return str.length > len ? str.slice(0, len - 1).trimEnd() + '…' : str;
}

export async function searchContent(ctx: Context, args: { username: string; query: string }) {
  const { currentUsername, prisma } = ctx;
  const { username, query } = args;
  const isOwnerViewing = currentUsername === username;

  const where: Record<string, unknown> = {
    redirect: 0,
    username,
    OR: [{ title: { contains: query, mode: 'insensitive' } }, { view: { contains: query, mode: 'insensitive' } }],
  };
  if (!isOwnerViewing) where['hidden'] = false;

  const collection = (await prisma.content.findMany({
    select: Object.assign({ view: true }, ATTRIBUTES_NAVIGATION),
    where: where as any,
    orderBy: [{ createdAt: 'desc' }],
    take: 50,
  })) as unknown as (DecoratedContent & { preview: string })[];

  const HTML_REGEX = /<[^>]+>/g;
  for (const item of collection) {
    item.preview = ellipsize(item.view.replace(HTML_REGEX, '').trim(), 130);
  }

  return decorateArrayWithRefreshFlag(collection);
}

export async function fetchSiteMap(ctx: Context, args: { username: string }) {
  const { currentUsername, prisma } = ctx;
  const { username } = args;
  const isOwnerViewing = currentUsername === username;
  const cacheKey = `sitemap:${username}`;
  const cachedData = !isOwnerViewing && customCache[cacheKey];
  if (cachedData) return cachedData;

  const constraints: { [key: string]: boolean } = {};
  if (!isOwnerViewing) constraints['hidden'] = false;

  const sections = (await prisma.content.findMany({
    select: ATTRIBUTES_NAVIGATION,
    where: Object.assign({}, constraints, {
      username,
      section: 'main',
      name: { notIn: ['main', 'home', 'comments'] },
      redirect: 0,
    }),
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })) as unknown as DecoratedContent[];

  let siteMap: DecoratedContent[] = [];
  for (const section of sections) {
    const albums = (await prisma.content.findMany({
      select: ATTRIBUTES_NAVIGATION,
      where: Object.assign({}, constraints, { username, section: section.name, album: 'main' }),
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })) as unknown as DecoratedContent[];

    siteMap.push(section);
    if (albums.length) siteMap = siteMap.concat(albums);
  }

  const decoratedSiteMap = decorateArrayWithRefreshFlag(siteMap);
  if (!isOwnerViewing) customCache[cacheKey] = decoratedSiteMap;
  return decoratedSiteMap;
}

export async function saveContent(ctx: Context, args: { name: string; title: string; hidden: boolean; view: string }) {
  const { currentUsername, prisma } = ctx;
  const { name, hidden, title, view } = args;
  const thread = discoverThreadInHTML(view);
  const threadUser = await threadUserFor(ctx, thread);

  const updatedContent = await prisma.content.update({
    data: { title, hidden, thread, threadUser, view },
    where: { username_name: { username: currentUsername, name } },
  });

  if (!hidden && updatedContent && ctx.currentUser) {
    await syndicate(ctx, ctx.currentUser, updatedContent, { isUpdate: true });
  }

  return { username: currentUsername, name, title, view };
}

export async function postContent(
  ctx: Context,
  args: {
    section: string;
    album: string;
    name: string;
    title: string;
    hidden: boolean;
    thumb: string;
    style: string;
    code: string;
    view: string;
  }
) {
  const { currentUsername, prisma } = ctx;
  let name = (args.name || 'untitled') + '-' + nanoid(10);
  name = name.replace(/[^A-Za-z0-9-]/, '-');

  const thread = discoverThreadInHTML(args.view);
  const threadUser = await threadUserFor(ctx, thread);

  const createdContent = await prisma.content.create({
    data: {
      username: currentUsername,
      section: args.section,
      album: args.album,
      name,
      title: args.title,
      thumb: args.thumb,
      thread,
      threadUser,
      hidden: args.hidden,
      redirect: 0,
      template: '',
      sortType: '',
      style: args.style,
      code: args.code,
      view: args.view,
    },
  });

  if (!args.hidden && ctx.currentUser) {
    await syndicate(ctx, ctx.currentUser, createdContent);
  }

  return {
    username: currentUsername,
    section: args.section,
    album: args.album,
    name,
    title: args.title,
    hidden: args.hidden,
    thumb: args.thumb,
    style: args.style,
    code: args.code,
    view: args.view,
  };
}

export async function deleteContent(ctx: Context, args: { name: string }) {
  const deletedContent = await ctx.prisma.content.delete({
    where: { username_name: { username: ctx.currentUsername, name: args.name } },
  });

  // Peers cached this post; tell them to drop it. Best-effort — the local
  // delete already happened and must not be undone by a dead inbox.
  if (deletedContent && !deletedContent.hidden && ctx.currentUser) {
    try {
      await unsyndicate(ctx, ctx.currentUser, deletedContent);
    } catch (ex) {
      console.error(ex);
    }
  }

  return true;
}

function discoverThreadInHTML(html: string) {
  const $ = cheerio.load(html);
  return $('a.u-in-reply-to').first().attr('href');
}

function getSQLSortType(sortType: string): { [key: string]: string } {
  if (sortType === 'oldest') return { createdAt: 'asc' };
  if (sortType === 'alphabetical') return { title: 'asc' };
  return { createdAt: 'desc' };
}

function decorateArrayWithRefreshFlag(list: DecoratedContent[]) {
  for (const item of list) decorateWithRefreshFlag(item);
  return list;
}

// Content carrying scripts has to arrive via a real page load: React renders
// view/code through dangerouslySetInnerHTML, and <script> inserted that way is
// never executed by the browser — only the parser runs it. `view` is absent from
// ATTRIBUTES_NAVIGATION, so sitemap links can't see scripts that live there.
function decorateWithRefreshFlag(item: DecoratedContent) {
  if (item) item.forceRefresh = !!(item.style || item.code || (item.view && /<script[\s>]/i.test(item.view)));
  return item;
}

function decorateArrayWithPrefetchImages(list: DecoratedContent[]) {
  for (const item of list) decoratePrefetchImages(item);
  return list;
}

function decoratePrefetchImages(item: DecoratedContent) {
  if (item) item.prefetchImages = (item.view?.match(/src=['"][^'"]+['"]/g) || []).map((i) => i.slice(5, -1));
  return item;
}
