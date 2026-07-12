import { buildUrl, contentUrl, profileUrl } from './url-factory';

// Builds the TanStack Router head() descriptor for a content page.
type ContentLike = {
  username: string;
  name: string;
  section: string;
  album: string;
  title?: string | null;
  thumb?: string | null;
  commentsCount?: number | null;
  commentsUpdated?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
} | null;

type OwnerLike = {
  description?: string | null;
  favicon?: string | null;
  logo?: string | null;
  viewport?: string | null;
  googleAnalytics?: string | null;
} | null;

function buildThumb(contentOwner: OwnerLike, host: string, content: ContentLike): string {
  let thumb = content?.thumb || '';
  if (thumb && !/^https?:/.test(thumb)) {
    thumb = buildUrl({ host, pathname: thumb });
  }
  if (!thumb) {
    thumb = buildUrl({ host, pathname: contentOwner?.logo || contentOwner?.favicon || '' });
  }
  return thumb;
}

export function buildContentHead(opts: { content: ContentLike; contentOwner: OwnerLike; host: string; title: string }) {
  const { content, contentOwner, host, title } = opts;
  const favicon = contentOwner?.favicon || '';
  const canonical = content ? contentUrl(content, undefined, host) : '';
  const resource = content ? profileUrl(content.username, host) : '';
  const thumb = buildThumb(contentOwner, host, content);

  const meta: Array<Record<string, unknown>> = [
    { title },
    { name: 'viewport', content: contentOwner?.viewport || 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#161313' },
    { name: 'description', content: contentOwner?.description || 'Hello, world.' },
    { property: 'og:title', content: content?.title || title },
    { property: 'og:description', content: contentOwner?.description || '' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: canonical },
    { property: 'og:site_name', content: title },
    { property: 'og:image', content: thumb },
  ];
  if (!content) meta.push({ name: 'robots', content: 'noindex' });

  const links: Array<Record<string, unknown>> = [
    { rel: 'icon', href: favicon || '/favicon.jpg', sizes: '32x32' },
    { rel: 'icon', href: favicon || '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', href: favicon || '/favicon.jpg' },
  ];
  if (canonical) links.push({ rel: 'canonical', href: canonical });
  if (contentOwner && resource) {
    links.push({
      rel: 'alternate',
      type: 'application/atom+xml',
      title,
      href: buildUrl({ pathname: '/api/social/feed', searchParams: { resource } }),
    });
    links.push({
      rel: 'webmention',
      href: buildUrl({ host, pathname: '/api/social/webmention', searchParams: { resource } }),
    });
  }
  if (content) {
    links.push({
      rel: 'alternate',
      type: 'application/json+oembed',
      title: content.title || '',
      href: buildUrl({ pathname: '/api/social/oembed', searchParams: { resource: canonical } }),
    });
  }

  // NB: scripts (JSON-LD + GA) are intentionally NOT part of the head() descriptor.
  // TanStack renders head scripts inside <head>, and since we hydrate the whole
  // document, a position-sensitive <script> there collides with Sentry's injected
  // <meta name="sentry-trace"> and causes a hydration mismatch. They're rendered
  // in the page body instead (see buildContentScripts + ContentHeadScripts).
  return { meta, links };
}

export type HeadScript = { type?: string; src?: string; async?: boolean; children?: string };

// JSON-LD + Google Analytics scripts for a content page, rendered in the body
// (not head) to keep document hydration stable alongside Sentry's head injection.
export function buildContentScripts(opts: {
  content: ContentLike;
  contentOwner: OwnerLike;
  host: string;
  title: string;
}): HeadScript[] {
  const { content, contentOwner, host, title } = opts;
  const canonical = content ? contentUrl(content, undefined, host) : '';
  const thumb = buildThumb(contentOwner, host, content);

  const scripts: HeadScript[] = [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'http://schema.org',
        '@type': 'NewsArticle',
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        headline: content?.title || title,
        image: [thumb],
        datePublished: new Date(content?.createdAt || Date.now()).toISOString(),
        dateModified: new Date(content?.updatedAt || Date.now()).toISOString(),
        author: { '@type': 'Person', name: content?.username || '' },
        publisher: { '@type': 'Organization', name: title },
        description: contentOwner?.description || '',
      }),
    },
  ];
  if (contentOwner?.googleAnalytics) {
    scripts.push({ src: `https://www.googletagmanager.com/gtag/js?id=${contentOwner.googleAnalytics}`, async: true });
    scripts.push({
      children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${contentOwner.googleAnalytics}');`,
    });
  }
  return scripts;
}
