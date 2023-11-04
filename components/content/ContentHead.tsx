import { Content, UserPublic } from 'data/graphql-generated';
import { buildUrl, contentUrl, profileUrl } from 'util/url-factory';

import Head from 'next/head';
import { useTheme } from 'components';

export default function ContentHead(props: {
  content?: Content;
  contentOwner: UserPublic;
  title: string;
  username: string;
  host: string;
}) {
  const { content, contentOwner, host, title, username } = props;
  const theme = useTheme();

  const repliesUrl =
    content && buildUrl({ pathname: '/api/social/comments', searchParams: { resource: contentUrl(content) } });
  const repliesAttribs = content && {
    'thr:count': content.commentsCount,
    'thr:updated': new Date(content.commentsUpdated).toISOString(),
  };
  let viewport = 'width=device-width, initial-scale=1';
  let description,
    favicon,
    rss,
    webmentionUrl = '';

  if (contentOwner) {
    const resource = profileUrl(username, undefined, host);
    description = <meta name="description" content={contentOwner.description || 'Hello, world.'} />;
    favicon = contentOwner.favicon;
    const feedUrl = buildUrl({ pathname: '/api/social/feed', searchParams: { resource } });
    rss = <link rel="alternate" type="application/atom+xml" title={title} href={feedUrl} />;
    viewport = contentOwner.viewport || viewport;
    webmentionUrl = buildUrl({ host, pathname: '/api/social/webmention', searchParams: { resource } });
  }

  const url = buildUrl({ host, pathname: '/' });
  const thumb = buildThumb(contentOwner, host, content);

  return (
    <Head>
      <title>{title}</title>
      {contentOwner ? (
        <link rel="author" href={contentUrl({ username, section: 'main', album: '', name: 'about' })} />
      ) : null}
      <link rel="icon" href={favicon || `/favicon.jpg`} />
      <link rel="shortcut icon" href={favicon || `/favicon.jpg`} />
      <link rel="apple-touch-icon" href={favicon || `/favicon.jpg`} />
      <link
        rel="search"
        href={buildUrl({ pathname: '/api/opensearch', searchParams: { username } })}
        type="application/opensearchdescription+xml"
        title={title}
      />
      <link rel="canonical" href={content && contentUrl(content, undefined, undefined, host)} />
      {rss}
      {!content && <meta name="robots" content="noindex" />}
      <meta name="viewport" content={viewport} />
      <meta name="theme-color" content={theme.palette.background.default} />
      {description}

      {/* This needs to be filled out by the developer to provide content for the site. Learn more here: http://ogp.me/ */}
      <meta property="og:title" content={content?.title} />
      <meta property="og:description" content={contentOwner?.description || ''} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={content && contentUrl(content, undefined, undefined, host)} />
      <meta property="og:site_name" content={title} />
      <meta property="og:image" content={thumb} />

      {/* This needs to be filled out by the developer to provide content for the site.
          Learn more here: https://developers.google.com/search/docs/guides/intro-structured-data
        */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: `
        {
          "@context": "http://schema.org",
          "@type": "NewsArticle",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${content ? contentUrl(content, undefined, undefined, host) : ''}"
          },
          "headline": "${content?.title}",
          "image": [
            "${thumb}"
           ],
          "datePublished": "${new Date(content?.createdAt || new Date()).toISOString()}",
          "dateModified": "${new Date(content?.updatedAt || new Date()).toISOString()}",
          "author": {
            "@type": "Person",
            "name": "${content?.username}"
          },
           "publisher": {
            "@type": "Organization",
            "name": "${title}",
            "logo": {
              "@type": "ImageObject",
              "url": "${url}favicon.jpg"
            }
          },
          "description": "${contentOwner?.description}"
        }
        `,
        }}
      />

      <link
        rel="alternate"
        type="application/json+oembed"
        href={buildUrl({
          pathname: '/api/social/oembed',
          searchParams: { resource: content ? contentUrl(content) : '' },
        })}
        title={content?.title}
      />
      {content && webmentionUrl ? <link rel="webmention" href={webmentionUrl} /> : null}
      {content?.commentsCount ? (
        <link rel="replies" type="application/atom+xml" href={repliesUrl} {...repliesAttribs} />
      ) : null}
      {contentOwner ? (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${contentOwner.googleAnalytics}`} />
      ) : null}
      {contentOwner ? (
        <script
          async
          dangerouslySetInnerHTML={{
            __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${contentOwner.googleAnalytics}');
          `,
          }}
        />
      ) : null}
    </Head>
  );
}

function buildThumb(contentOwner: UserPublic, host: string, content?: Content) {
  let thumb;
  if (content?.thumb) {
    thumb = content.thumb;
    if (!/^https?:/.test(thumb)) {
      thumb = buildUrl({ host, pathname: thumb });
    }
  }

  if (!thumb) {
    thumb = buildUrl({ host, pathname: contentOwner?.logo || contentOwner?.favicon || '' });
  }

  return thumb;
}
