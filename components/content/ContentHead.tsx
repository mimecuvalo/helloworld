import { Content, UserPublic } from 'data/graphql-generated';
import { buildUrl, contentUrl, profileUrl } from 'util/url-factory';

import Head from 'next/head';

export default function ContentHead(props: {
  content?: Content;
  contentOwner: UserPublic;
  title: string;
  username: string;
}) {
  const { content, contentOwner, title, username } = props;

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
    const resource = profileUrl(username);
    description = <meta name="description" content={contentOwner.description || 'Hello, world.'} />;
    favicon = contentOwner.favicon;
    const feedUrl = buildUrl({ pathname: '/api/social/feed', searchParams: { resource } });
    rss = <link rel="alternate" type="application/atom+xml" title={title} href={feedUrl} />;
    //theme = contentOwner.theme && <link rel="stylesheet" href={contentOwner.theme} />;
    viewport = contentOwner.viewport || viewport;
    webmentionUrl = buildUrl({ pathname: '/api/social/webmention', searchParams: { resource } });
  }

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
      <link rel="canonical" href={content && contentUrl(content)} />
      {rss}
      {!content && <meta name="robots" content="noindex" />}
      <meta name="viewport" content={viewport} />
      <meta name="theme-color" content="#000000" />
      {description}
      <OpenGraphMetadata contentOwner={contentOwner} content={content} title={title} />
      <StructuredMetaData contentOwner={contentOwner} content={content} title={title} />
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
      {contentOwner ? <GoogleAnalytics contentOwner={contentOwner} /> : null}
    </Head>
  );
}

// This needs to be filled out by the developer to provide content for the site.
// Learn more here: http://ogp.me/
function OpenGraphMetadata({
  contentOwner,
  content,
  title,
}: {
  contentOwner: UserPublic;
  content?: Content;
  title: string;
}) {
  const thumb = buildThumb(contentOwner, content);

  return (
    <>
      <meta property="og:title" content={content?.title} />
      <meta property="og:description" content={contentOwner?.description || ''} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={content && contentUrl(content)} />
      <meta property="og:site_name" content={title} />
      <meta property="og:image" content={thumb} />
    </>
  );
}

function buildThumb(contentOwner: UserPublic, content?: Content) {
  let thumb;
  if (content?.thumb) {
    thumb = content.thumb;
    if (!/^https?:/.test(thumb)) {
      thumb = buildUrl({ pathname: thumb });
    }
  }

  if (!thumb) {
    thumb = buildUrl({ pathname: contentOwner?.logo || contentOwner?.favicon || '' });
  }

  return thumb;
}

// This needs to be filled out by the developer to provide content for the site.
// Learn more here: https://developers.google.com/search/docs/guides/intro-structured-data
function StructuredMetaData({
  contentOwner,
  content,
  title,
}: {
  contentOwner: UserPublic;
  content?: Content;
  title: string;
}) {
  const url = buildUrl({ pathname: '/' });
  const thumb = buildThumb(contentOwner, content);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: `
        {
          "@context": "http://schema.org",
          "@type": "NewsArticle",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${content ? contentUrl(content) : ''}"
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
  );
}

// TODO(mime): meh, lame that this is in the <head> but I don't feel like moving this to HTMLBase where we don't have
// contentOwner currently.
function GoogleAnalytics({ contentOwner }: { contentOwner: UserPublic }) {
  return (
    <script
      async
      dangerouslySetInnerHTML={{
        __html: `
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', '${contentOwner.googleAnalytics}']);
        _gaq.push(['_trackPageview']);

        (function() {
          var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
          ga.src = 'https://ssl.google-analytics.com/ga.js';
          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
        })();
        `,
      }}
    />
  );
}
