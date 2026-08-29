import * as cheerio from 'cheerio';
import groupBy from 'lodash/groupBy';
import { nanoid } from 'nanoid';
import type { Context } from '../context';
import type { Content } from '../../generated/prisma/client';
import constants from '../../util/constants';
import { isRobotViewing } from '../crawler';
import { HTTPError } from '../exceptions';
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
  lqip: true,
  hidden: true,
  template: true,
  style: true,
  code: true,
};

// Names the site itself navigates by: 'home' is what an unknown name falls back
// to, 'main' is the top-level page, and 'comments' backs the comment threads.
// Renaming one, or renaming something else on top of one, breaks that wiring.
const STRUCTURAL_NAMES = ['main', 'home', 'comments'];

// Slugs live in urls, so they get the same treatment a new post's name gets.
export function cleanName(name: string) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

// KV cache for neighbors and collection (Vercel egress limits).
const customCache: { [key: string]: any } = {};

// Every cache key carries the username it belongs to, so a write by that user
// can drop their slice of it wholesale. Renames move rows between sections, and
// a stale sitemap or collection would keep linking at the old url.
function clearContentCache(username: string) {
  for (const key of Object.keys(customCache)) {
    if (key.includes(username)) delete customCache[key];
  }
}

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

  // A rename leaves a stub behind at the old name pointing at the row that moved.
  // Hand back the target: the page canonicalizes its own url from what it renders,
  // so the address bar catches up on its own.
  if (content?.redirect) {
    const target = (await prisma.content.findUnique({ where: { id: content.redirect } })) as DecoratedContent | null;
    // The row the stub pointed at is gone. The old url has nowhere left to send
    // anyone, so it is a 404 — rendering the stub itself would serve a page with
    // no title and no body.
    if (!target) return null;
    content = target;
    name = target.name;
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

  // The css and js tabs hold bare source, and it is rendered into the page as
  // markup — so give it the tags that make a browser treat it as code. Content
  // that already brought its own <style>/<script>/<link> is left alone. Wrapping
  // here, after the inheritance merges above, means one tag around the lot.
  content.style = wrapSource(content.style, 'style', /<link|<style/i);
  content.code = wrapSource(content.code, 'script', /<script/i);

  return decorateWithRefreshFlag(content);
}

function wrapSource(source: string, tag: 'style' | 'script', alreadyWrapped: RegExp) {
  return !source || alreadyWrapped.test(source) ? source : `<${tag}>\n${source}\n</${tag}>`;
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
        select: { thumb: true, lqip: true },
        where: albumConstraints,
        orderBy,
      });
      if (albumFirstContent) {
        content.thumb = albumFirstContent.thumb;
        content.lqip = albumFirstContent.lqip;
      }
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

// The sitemap is drawn from two kinds of group, and they are the only two that
// can be reordered: the top-level rows (a section is one of these), and the
// albums filed inside one section. fetchSiteMap and orderContent both select on
// this, so a reorder renumbers exactly the rows the sidebar drew.
function siteMapGroupWhere(username: string, section: string) {
  return section === 'main'
    ? { username, section: 'main', name: { notIn: STRUCTURAL_NAMES }, redirect: 0 }
    : { username, section, album: 'main' };
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
    where: Object.assign({}, constraints, siteMapGroupWhere(username, 'main')),
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })) as unknown as DecoratedContent[];

  // Every section's albums in one query rather than one query per section: the
  // rows come back in the same order the per-section queries produced them, so
  // grouping them here rebuilds the identical list.
  const albums = (await prisma.content.findMany({
    select: ATTRIBUTES_NAVIGATION,
    where: Object.assign({}, constraints, {
      username,
      section: { in: sections.map((section) => section.name) },
      album: 'main',
    }),
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })) as unknown as DecoratedContent[];

  const albumsBySection = groupBy(albums, 'section');

  const siteMap: DecoratedContent[] = [];
  for (const section of sections) {
    siteMap.push(section);
    siteMap.push(...(albumsBySection[section.name] || []));
  }

  const decoratedSiteMap = decorateArrayWithRefreshFlag(siteMap);
  if (!isOwnerViewing) customCache[cacheKey] = decoratedSiteMap;
  return decoratedSiteMap;
}

// Sidebar order. The client sends a whole group's names in the order it wants
// them rather than a (dragged, position) pair: replaying it lands the same rows
// in the same places, so a dropped response or a double-submit can't shuffle
// anything. `section` names the group — 'main' is the top-level list, anything
// else is that section's albums.
export async function orderContent(ctx: Context, args: { section: string; names: string[] }) {
  const { currentUsername, prisma } = ctx;
  const { section, names } = args;

  const group = await prisma.content.findMany({
    select: { name: true },
    where: siteMapGroupWhere(currentUsername, section),
  });
  const groupNames = new Set(group.map((item) => item.name));

  // The list has to be the group exactly. A sitemap gone stale — something
  // renamed, deleted or moved in another tab — would otherwise renumber rows
  // that left the group, or leave the ones that joined it sharing an order with
  // whatever happens to sit at that index. Refusing sends the client back for a
  // fresh sitemap, which is the only way it can ask for something meaningful.
  if (names.length !== groupNames.size || names.some((name) => !groupNames.has(name))) {
    return { error: 'stale-order' as const };
  }

  await prisma.$transaction(
    names.map((name, order) =>
      prisma.content.update({
        data: { order },
        where: { username_name: { username: currentUsername, name } },
      })
    )
  );

  clearContentCache(currentUsername);

  return { ordered: names };
}

// A page's own row, straight out of the database — no album/section style and
// code folded in the way fetchContent does it, because the editor writes these
// fields back and inherited css would end up duplicated into the child.
export async function fetchEditableContent(ctx: Context, args: { name: string }) {
  const { currentUsername, prisma } = ctx;
  return prisma.content.findUnique({
    select: {
      section: true,
      album: true,
      name: true,
      title: true,
      template: true,
      thumb: true,
      lqip: true,
      hidden: true,
      style: true,
      code: true,
      view: true,
    },
    where: { username_name: { username: currentUsername, name: args.name } },
  });
}

export async function saveContent(
  ctx: Context,
  args: {
    name: string;
    title: string;
    hidden: boolean;
    view: string;
    newName?: string;
    section?: string;
    album?: string;
    template?: string;
    thumb?: string;
    lqip?: number | null;
    style?: string;
    code?: string;
    sensitive?: boolean;
    contentWarning?: string | null;
  }
) {
  const { currentUsername, prisma } = ctx;
  const { hidden, title, view } = args;

  // Resolving the author of whatever this replies to talks to a remote server,
  // so it happens before the transaction opens rather than holding one over a
  // network round trip.
  const thread = discoverThreadInHTML(view);
  const threadUser = await threadUserFor(ctx, thread);

  // One transaction: a rename rewrites the row, everything filed under it, and
  // the stub left at the old url. Landing half of that would strand the children
  // under a name nothing points at any more, where no collection query finds them.
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.content.findUnique({
      where: { username_name: { username: currentUsername, name: args.name } },
    });
    if (!existing) throw new HTTPError(404, args.name, 'no such content');

    const { section: oldSection, album: oldAlbum, name: oldName, hidden: oldHidden } = existing;
    // Two kinds of container: a section lives at section 'main', an album at
    // album 'main'. Everything filed under one follows it around.
    const isSection = oldSection === 'main';
    const isAlbum = oldAlbum === 'main';

    const name = args.newName === undefined ? oldName : cleanName(args.newName) || oldName;
    if (name !== oldName) {
      if (STRUCTURAL_NAMES.includes(oldName)) return { error: 'structural-name' as const };
      if (constants.reservedNames.includes(name) || STRUCTURAL_NAMES.includes(name)) {
        return { error: 'reserved-name' as const };
      }
      const clash = await tx.content.findUnique({
        select: { id: true, redirect: true },
        where: { username_name: { username: currentUsername, name } },
      });
      // A stub from an earlier rename is not a real occupant of the name —
      // otherwise changing your mind and renaming back would be refused forever.
      // Taking the name costs that old url its signpost, which is the right
      // trade: a rename asked for now beats one asked for before.
      if (clash && !clash.redirect) return { error: 'duplicate-name' as const };
      if (clash) await tx.content.delete({ where: { id: clash.id } });
    }

    // A container's placement is a single choice — which section it sits in — and
    // the marker column follows from it: 'main' means it is a section itself.
    const section = args.section === undefined ? oldSection : args.section;
    let album = args.album === undefined ? oldAlbum : args.album;
    if (isSection || isAlbum) {
      album = section === 'main' ? '' : 'main';
    }
    // Sections are top level by definition; there is nowhere to nest one.
    if (isSection && section !== 'main') return { error: 'cannot-nest-section' as const };

    const childWhere = isSection
      ? { username: currentUsername, section: oldName }
      : { username: currentUsername, section: oldSection, album: oldName };

    // Hiding a container hides what's inside it, same as unhiding.
    if ((isSection || isAlbum) && hidden !== oldHidden) {
      await tx.content.updateMany({ where: childWhere, data: { hidden } });
    }

    // Renaming or moving a container rewrites the section/album its children point
    // at. An album promoted to the top level becomes their section outright.
    if (isSection && name !== oldName) {
      await tx.content.updateMany({ where: childWhere, data: { section: name } });
    } else if (isAlbum && (name !== oldName || section !== oldSection)) {
      await tx.content.updateMany({
        where: childWhere,
        data: section === 'main' ? { section: name, album: '' } : { section, album: name },
      });
    }

    const updated = await tx.content.update({
      data: {
        name,
        section,
        album,
        title,
        hidden,
        thread,
        threadUser,
        view,
        ...(args.template === undefined ? {} : { template: args.template }),
        ...(args.thumb === undefined ? {} : { thumb: args.thumb }),
        ...(args.lqip === undefined ? {} : { lqip: args.lqip }),
        ...(args.style === undefined ? {} : { style: args.style }),
        ...(args.code === undefined ? {} : { code: args.code }),
        ...(args.sensitive === undefined ? {} : { sensitive: args.sensitive }),
        ...(args.contentWarning === undefined ? {} : { contentWarning: args.contentWarning || null }),
      },
      where: { username_name: { username: currentUsername, name: oldName } },
    });

    // Leave a signpost at the old url. Hidden content was never linked anywhere
    // public, so it doesn't need one.
    if (name !== oldName && !hidden) {
      await tx.content.create({
        data: {
          username: currentUsername,
          section: oldSection,
          album: oldAlbum,
          name: oldName,
          redirect: updated.id,
          title: '',
          thumb: '',
          template: '',
          sortType: '',
          style: '',
          code: '',
          view: '',
          createdAt: existing.createdAt,
        },
      });
    }

    return { updated, saved: { username: currentUsername, section, album, name, title, view } };
  });

  if ('error' in result) return result;

  clearContentCache(currentUsername);

  // The signing keys come off the row only when there is actually something to
  // federate, which is why this asks for the full user here rather than up top.
  const author = hidden ? null : await ctx.fullUser();
  if (author) {
    await syndicate(ctx, author, result.updated, { isUpdate: true });
  }

  return result.saved;
}

// Sections and albums are the two containers the site navigates by, and both are
// just rows with a reserved marker: a section is `main`/'' and an album is
// `<section>`/`main`. Creating one is deliberately not postContent — a container
// is structure rather than something written, so it is never syndicated, and an
// empty page must not land in anyone's feed.
export async function createContainer(
  ctx: Context,
  args: { kind: 'section' | 'album'; title: string; section?: string }
) {
  const { currentUsername, prisma } = ctx;
  const title = args.title.trim();
  const name = cleanName(title);
  if (!name) return { error: 'invalid-name' as const };
  if (constants.reservedNames.includes(name) || STRUCTURAL_NAMES.includes(name)) {
    return { error: 'reserved-name' as const };
  }

  const clash = await prisma.content.findUnique({
    select: { id: true },
    where: { username_name: { username: currentUsername, name } },
  });
  if (clash) return { error: 'duplicate-name' as const };

  // An album hangs off a section, so that section has to be one — and a hidden
  // section's albums start hidden too, matching how posts filed into one behave.
  let parent = null;
  if (args.kind === 'album') {
    parent = await prisma.content.findUnique({
      select: { name: true, section: true, hidden: true },
      where: { username_name: { username: currentUsername, name: args.section || '' } },
    });
    if (!parent || parent.section !== 'main') return { error: 'no-such-section' as const };
  }

  // The nav sorts on `order`, and every existing sibling has one, so leaving a
  // new container at the default 0 would put it ahead of everything already
  // there. It belongs at the end.
  const siblings = await prisma.content.findMany({
    select: { order: true },
    where:
      args.kind === 'section'
        ? { username: currentUsername, section: 'main', album: '' }
        : { username: currentUsername, section: parent!.name, album: 'main' },
  });
  const order = siblings.reduce((max, sibling) => Math.max(max, sibling.order), 0) + 1;

  // A container whose template is blank renders as a page of its own body and
  // never lists what is inside it, which is not what anyone means by making one.
  const created = await prisma.content.create({
    data: {
      username: currentUsername,
      section: args.kind === 'section' ? 'main' : parent!.name,
      album: args.kind === 'section' ? '' : 'main',
      name,
      title,
      order,
      template: args.kind === 'section' ? 'latest' : 'album',
      thumb: '',
      sortType: '',
      redirect: 0,
      hidden: !!parent?.hidden,
      style: '',
      code: '',
      view: '',
    },
  });

  clearContentCache(currentUsername);

  return {
    username: currentUsername,
    section: created.section,
    album: created.album,
    name: created.name,
    title: created.title,
    hidden: created.hidden,
  };
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
    lqip?: number | null;
    style: string;
    code: string;
    view: string;
    template?: string;
    sensitive?: boolean;
    contentWarning?: string | null;
  }
) {
  const { currentUsername, prisma } = ctx;

  // A slug the author typed is used exactly as typed, and has to be free.
  // Anything else gets one made from the title, with a suffix so posting twice
  // under the same heading doesn't collide.
  let name = cleanName(args.name || '');
  if (name) {
    if (constants.reservedNames.includes(name) || STRUCTURAL_NAMES.includes(name)) {
      return { error: 'reserved-name' as const };
    }
    const clash = await prisma.content.findUnique({
      select: { id: true },
      where: { username_name: { username: currentUsername, name } },
    });
    if (clash) return { error: 'duplicate-name' as const };
  } else {
    name = `${cleanName(args.title) || 'untitled'}-${nanoid(10).replace(/[^A-Za-z0-9]/g, '-')}`;
  }

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
      lqip: args.lqip ?? null,
      thread,
      threadUser,
      hidden: args.hidden,
      redirect: 0,
      template: args.template || '',
      sortType: '',
      style: args.style,
      code: args.code,
      view: args.view,
      sensitive: args.sensitive ?? false,
      contentWarning: args.contentWarning || null,
    },
  });

  clearContentCache(currentUsername);

  const author = args.hidden ? null : await ctx.fullUser();
  if (author) {
    await syndicate(ctx, author, createdContent);
  }

  return {
    username: currentUsername,
    section: args.section,
    album: args.album,
    name,
    title: args.title,
    hidden: args.hidden,
    thumb: args.thumb,
    lqip: args.lqip ?? null,
    style: args.style,
    code: args.code,
    view: args.view,
  };
}

export async function deleteContent(ctx: Context, args: { name: string }) {
  const deletedContent = await ctx.prisma.content.delete({
    where: { username_name: { username: ctx.currentUsername, name: args.name } },
  });

  // Signposts to a page that no longer exists. Clearing them here is what keeps
  // a dangling stub exceptional rather than routine, and it hands their names
  // back for reuse.
  await ctx.prisma.content.deleteMany({
    where: { username: ctx.currentUsername, redirect: deletedContent.id },
  });

  clearContentCache(ctx.currentUsername);

  // Peers cached this post; tell them to drop it. Best-effort — the local
  // delete already happened and must not be undone by a dead inbox.
  const author = deletedContent && !deletedContent.hidden ? await ctx.fullUser() : null;
  if (author) {
    try {
      await unsyndicate(ctx, author, deletedContent);
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
