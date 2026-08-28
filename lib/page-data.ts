import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createContext } from 'server/context';
import { allowContentScripts } from 'server/content-csp';
import * as content from 'server/services/content';
import * as contentRemote from 'server/services/content-remote';
import * as user from 'server/services/user';
import { createLiteYouTubeVideos } from 'util/media';

export const loadContentPage = createServerFn({ method: 'GET' })
  .validator((input: { username: string; name: string }) => input)
  .handler(async ({ data }) => {
    const ctx = await createContext(getRequest());
    const { name } = data;

    const contentItem = await content.fetchContent(ctx, { username: data.username, name });
    const username = contentItem?.username || data.username;

    const [contentOwner, comments, favorites, siteMap, neighbors] = await Promise.all([
      user.fetchPublicUserData(ctx, username),
      contentRemote.fetchCommentsRemote(ctx, { username, name }),
      contentRemote.fetchFavoritesRemote(ctx, { username, name }),
      username ? content.fetchSiteMap(ctx, { username }) : Promise.resolve([]),
      content.fetchContentNeighbors(ctx, { username, name }),
    ]);

    // Transform the view server-side (youtube iframes → <lite-youtube>, drop
    // empty <p></p>) so cheerio stays out of the client bundle and SSR/hydration
    // markup match.
    if (contentItem?.view) {
      contentItem.view = createLiteYouTubeVideos(contentItem.view.replaceAll('<p></p>', ''));
    }

    // Whitelist this page's own inline <script>s in the CSP. Must run after the
    // view transform and after fetchContent merged in the album/section style+code,
    // so we hash exactly what gets streamed. Only the Content row (owner-authored)
    // is eligible — feed items render client-side, and comments are never included.
    if (contentItem) {
      allowContentScripts(contentItem.view, contentItem.code, contentItem.style, contentOwner?.sidebarHtml);
    }

    return {
      content: contentItem,
      contentOwner,
      comments,
      favorites,
      siteMap,
      neighbors,
      host: ctx.hostname,
      currentUsername: ctx.currentUsername,
    };
  });

export type ContentPageData = Awaited<ReturnType<typeof loadContentPage>>;

export const loadSearch = createServerFn({ method: 'GET' })
  .validator((input: { username: string; query: string }) => input)
  .handler(async ({ data }) => {
    const ctx = await createContext(getRequest());
    const { username, query } = data;

    const [results, contentOwner, siteMap] = await Promise.all([
      content.searchContent(ctx, { username, query }),
      user.fetchPublicUserDataSearch(ctx, username),
      content.fetchSiteMap(ctx, { username }),
    ]);

    return {
      results,
      contentOwner,
      siteMap,
      query,
      host: ctx.hostname,
      currentUsername: ctx.currentUsername,
    };
  });

export type SearchPageData = Awaited<ReturnType<typeof loadSearch>>;

export const loadDashboard = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await createContext(getRequest());
  if (!ctx.currentUser) return { user: null };
  const { username, name, title, favicon, logo, theme, superuser } = ctx.currentUser;
  return { user: { username, name, title, favicon, logo, theme, superuser } };
});

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
