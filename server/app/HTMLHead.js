import { buildUrl, contentUrl, profileUrl } from '../../shared/util/url_factory';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';

@graphql(
  gql`
    query ContentAndUserQuery($username: String!, $name: String!) {
      fetchContentHead(username: $username, name: $name) {
        username
        section
        album
        name
        thumb
        title
        createdAt
        updatedAt
        comments_count
        comments_updated
      }

      fetchPublicUserDataHead(username: $username) {
        description
        favicon
        google_analytics
        logo
        name
        theme
        title
        username
        viewport
      }
    }
  `,
  {
    options: ({ req }) => {
      // The username is either the first part of the path (e.g. hostname.com/mime/section/album/name)
      // or if we're on a user that has a `hostname` defined then it's implicit in the url
      // (e.g. hostname.com/section/album/name) and we figure it out in the user resolver.
      const splitPath = req.path.split('/');
      const probableContentUsername = splitPath[1];
      const probableContentName = splitPath[splitPath.length - 1];

      return {
        variables: {
          username: decodeURIComponent(probableContentUsername),
          name: decodeURIComponent(probableContentName),
        },
      };
    },
  }
)
class HTMLHead extends PureComponent {
  render() {
    const { appName, assetPathsByType, nonce, publicUrl, req } = this.props;

    // XXX(mime): terrible hack until i figure out what's going on.
    // seems that having the same query twice in a tree while doing SSR will prevent rendering of the first
    // component. in this case, HTMLHead's data will be missing.
    const contentOwner = this.props.data.fetchPublicUserDataHead;
    const content = this.props.data.fetchContentHead;

    let description, favicon, rss, theme, title, username, webmentionUrl;
    const repliesUrl =
      content && buildUrl({ pathname: '/api/social/comments', searchParams: { resource: contentUrl(content) } });
    const repliesAttribs = content && {
      'thr:count': content.comments_count,
      'thr:updated': new Date(content.comments_updated).toISOString(),
    };
    let viewport = 'width=device-width, initial-scale=1';

    if (contentOwner) {
      username = contentOwner.username;
      const resource = profileUrl(username, req);
      description = <meta name="description" content={contentOwner.description || 'Hello, world.'} />;
      favicon = contentOwner.favicon;
      const feedUrl = buildUrl({ pathname: '/api/social/feed', searchParams: { resource } });
      rss = <link rel="alternate" type="application/atom+xml" title={title} href={feedUrl} />;
      theme = contentOwner.theme && <link rel="stylesheet" href={contentOwner.theme} />;
      title = contentOwner.title;
      viewport = contentOwner.viewport || viewport;
      webmentionUrl = buildUrl({ req, pathname: '/api/social/webmention', searchParams: { resource } });
    }

    if (!theme) {
      theme = <link rel="stylesheet" href="/css/themes/pixel.css" />;
    }

    if (!title) {
      title = appName;
    }

    return (
      <head>
        <meta charSet="utf-8" />
        <link rel="author" href={`${publicUrl}humans.txt`} />
        {contentOwner ? <link rel="author" href={contentUrl({ username, section: 'main', name: 'about' })} /> : null}
        <link rel="icon" href={favicon || `${publicUrl}favicon.ico`} />
        {assetPathsByType['css'].map(path => (
          <link nonce={nonce} rel="stylesheet" key={path} href={path} />
        ))}
        {theme}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        <link
          rel="search"
          href={buildUrl({ pathname: '/api/opensearch', searchParams: { username } })}
          type="application/opensearchdescription+xml"
          title={title}
        />
        <link rel="canonical" href={content && contentUrl(content, req)} />
        {rss}
        <meta name="viewport" content={viewport} />
        <meta name="theme-color" content="#000000" />
        <meta name="generator" content="Hello, world. https://github.com/mimecuvalo/helloworld" />
        {description}
        <OpenGraphMetadata contentOwner={contentOwner} content={content} title={title} req={req} />
        <StructuredMetaData contentOwner={contentOwner} content={content} nonce={nonce} title={title} req={req} />
        <link
          rel="alternate"
          type="application/json+oembed"
          href={buildUrl({
            pathname: '/api/social/oembed',
            searchParams: { resource: content && contentUrl(content) },
          })}
          title={content?.title}
        />
        {content && webmentionUrl ? <link rel="webmention" href={webmentionUrl} /> : null}
        {content?.comments_count ? (
          <link rel="replies" type="application/atom+xml" href={repliesUrl} {...repliesAttribs} />
        ) : null}
        {/*
          manifest.json provides metadata used when your web app is added to the
          homescreen on Android. See https://developers.google.com/web/fundamentals/web-app-manifest/
        */}
        <link rel="manifest" href={`${publicUrl}manifest.json`} />
        {/*
          Notice the use of publicUrl in the tags above.
          It will be replaced with the URL of the `public` folder during the build.
          Only files inside the `public` folder can be referenced from the HTML.

          Unlike "/favicon.ico" or "favicon.ico", "${publicUrl}favicon.ico" will
          work correctly both with client-side routing and a non-root public URL.
          Learn how to configure a non-root public URL by running `npm run build`.
        */}
        <title>{(content?.title ? content.title + ' – ' : '') + title}</title>
        {/*
          XXX(mime): Material UI's server-side rendering for CSS doesn't allow for inserting CSS the same way we do
          Apollo's data (see apolloStateFn in HTMLBase). So for now, we just do a string replace, sigh.
          See related hacky code in server/app/app.js
        */}
        <style id="jss-ssr" dangerouslySetInnerHTML={{ __html: `<!--MATERIAL-UI-CSS-SSR-REPLACE-->` }} />
        {contentOwner ? <GoogleAnalytics nonce={nonce} contentOwner={contentOwner} /> : null}
      </head>
    );
  }
}

// This needs to be filled out by the developer to provide content for the site.
// Learn more here: http://ogp.me/
const OpenGraphMetadata = React.memo(function OpenGraphMetadata({ contentOwner, content, title, req }) {
  const thumb = buildThumb(contentOwner, content, req);

  return (
    <>
      <meta property="og:title" content={content?.title} />
      <meta property="og:description" content={contentOwner?.description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={content && contentUrl(content, req)} />
      <meta property="og:site_name" content={title} />
      <meta property="og:image" content={thumb} />
    </>
  );
});

function buildThumb(contentOwner, content, req) {
  let thumb;
  if (content?.thumb) {
    thumb = content.thumb;
    if (!/^https?:/.test(thumb)) {
      thumb = buildUrl({ req, pathname: thumb });
    }
  }

  if (!thumb) {
    thumb = buildUrl({ req, pathname: contentOwner?.logo || contentOwner?.favicon });
  }

  return thumb;
}

// This needs to be filled out by the developer to provide content for the site.
// Learn more here: https://developers.google.com/search/docs/guides/intro-structured-data
function StructuredMetaData({ contentOwner, content, title, req, nonce }) {
  const url = buildUrl({ req, pathname: '/' });
  const thumb = buildThumb(contentOwner, content, req);

  return (
    <script
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: `
        {
          "@context": "http://schema.org",
          "@type": "NewsArticle",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${contentUrl(content, req)}"
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
              "url": "${url}favicon.ico"
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
function GoogleAnalytics({ nonce, contentOwner }) {
  return (
    <script
      nonce={nonce}
      async
      dangerouslySetInnerHTML={{
        __html: `
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', '${contentOwner.google_analytics}']);
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

export default HTMLHead;
