import Document, { DocumentContext, DocumentInitialProps, Head, Html, Main, NextScript } from 'next/document';
import { ReactNode, StrictMode } from 'react';
import { buildUrl, contentUrl } from 'util/url-factory';
import { createEmotionCache, muiTheme } from 'styles';

import createEmotionServer from '@emotion/server/create-instance';
import crypto from 'crypto';
import { gql } from '@apollo/client';
import { v4 } from 'uuid';
import { withRouter } from 'next/router';

const HOSTNAME = 'www.nightlight.rocks';
const TITLE = 'Hello, world.';

const generateCsp = (): [csp: string, nonce: string] => {
  const hash = crypto.createHash('sha256');
  hash.update(v4());
  const nonce = hash.digest('base64');

  const isDevelopment = process.env.NODE_ENV === 'development';
  const cspDirectives: { [key: string]: string[] } = {
    'connect-src': isDevelopment ? ['*'] : ["'self'", 'https://*.ingest.sentry.io'],
    'default-src': ["'self'"],
    'font-src': ["'self'", 'https:'],
    'frame-ancestors': ["'self'"],
    'frame-src': ["'self'", 'http:', 'https:'],
    'img-src': ['data:', 'http:', 'https:'],
    'manifest-src': ["'self'"],
    'media-src': ["'self'", 'blob:'],
    'object-src': ["'self'"],
    'prefetch-src': ["'self'"],
    'report-uri': ['/api/report-csp-violation'],
    'script-src': ["'self'", 'https://cdn.auth0.com', 'https://storage.googleapis.com'].concat(
      isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : [`'nonce-${nonce}'`]
    ),

    // XXX(mime): we have inline styles around - can we pass nonce around the app properly?
    'style-src': ["'self'", 'https:', "'unsafe-inline'"], //(req, res) => `'nonce-${nonce}'`],
  };
  if (!isDevelopment) {
    cspDirectives['upgrade-insecure-requests'] = [];
  }
  const csp = Object.keys(cspDirectives)
    .map((directive) => `${directive} ${cspDirectives[directive].join(' ')}`)
    .join('; ');

  return [csp, nonce];
};

const CONTENT_AND_USER_QUERY = gql`
  query ContentAndUserQueryDocument($username: String!, $name: String!) {
    fetchContentHead(username: $username, name: $name) {
      username
      section
      album
      name
      thumb
      title
      createdAt
      updatedAt
      commentsCount
      commentsUpdated
    }

    fetchPublicUserDataHead(username: $username) {
      description
      favicon
      googleAnalytics
      logo
      name
      theme
      title
      username
      viewport
    }
  }
`;

// NOTE: Keep in sync with index.html for service workers!
export function HTMLHead(props) {
  const { appName, assetPathsByType, nonce, publicUrl, req } = props;
  // The username is either the first part of the path (e.g. hostname.com/mime/section/album/name)
  // or if we're on a user that has a `hostname` defined then it's implicit in the url
  // (e.g. hostname.com/section/album/name) and we figure it out in the user resolver.
  const splitPath = req.path.split('/');
  const probableContentUsername = splitPath[1];
  const probableContentName = splitPath[splitPath.length - 1];

  const { loading, data } = useQuery(CONTENT_AND_USER_QUERY, {
    variables: {
      username: decodeURIComponent(probableContentUsername),
      name: decodeURIComponent(probableContentName),
    },
  });

  if (loading) {
    return null;
  }

  // XXX(mime): terrible hack until i figure out what's going on.
  // seems that having the same query twice in a tree while doing SSR will prevent rendering of the first
  // component. in this case, HTMLHead's data will be missing.
  const contentOwner = data.fetchPublicUserDataHead;
  const content = data.fetchContentHead;

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
      <link rel="icon" href={favicon || `${publicUrl}favicon.jpg`} />
      <link rel="apple-touch-icon" href={favicon || `${publicUrl}favicon.jpg`} />
      {assetPathsByType['css'].map((path) => (
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
      {!content && <meta name="robots" content="noindex" />}
      <meta name="viewport" content={viewport} />
      <meta name="theme-color" content="#000000" />
      <meta name="generator" content="Hello, world. https://github.com/mimecuvalo/helloworld" />
      <meta property="csp-nonce" content={nonce} />
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `__webpack_nonce__ = '${nonce}'`,
        }}
      />
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

        Unlike "/favicon.jpg" or "favicon.jpg", "${publicUrl}favicon.jpg" will
        work correctly both with client-side routing and a non-root public URL.
        Learn how to configure a non-root public URL by running `npm run build`.
      */}
      <title>{(content?.title ? content.title + ' – ' : '') + title}</title>
      {/*
        XXX(mime): Material UI's server-side rendering for CSS doesn't allow for inserting CSS the same way we do
        Apollo's data (see apolloStateFn in HTMLBase). So for now, we just do a string replace, sigh.
        See related hacky code in server/app/app.js
      */}
      <style id="jss-ssr" nonce={nonce} dangerouslySetInnerHTML={{ __html: `<!--CSS-SSR-REPLACE-->` }} />
      {contentOwner ? <GoogleAnalytics nonce={nonce} contentOwner={contentOwner} /> : null}
    </head>
  );
}

export interface CustomDocumentInitialProps extends DocumentInitialProps {
  emotionStyleTags: ReactNode[];
}

class MyDocument extends Document {
  // Based off of: https://github.com/mui-org/material-ui/blob/master/examples/nextjs/pages/_document.js
  static async getInitialProps(ctx: DocumentContext): Promise<CustomDocumentInitialProps> {
    const originalRenderPage = ctx.renderPage;

    // You can consider sharing the same emotion cache between all the SSR requests to speed up performance.
    // However, be aware that it can have global side effects.
    const cache = createEmotionCache();
    const { extractCriticalToChunks } = createEmotionServer(cache);

    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) =>
          function EnhanceApp(props) {
            // @ts-ignore not sure how to fix this yet
            return <App emotionCache={cache} {...props} />;
          },
      });

    const initialProps = await Document.getInitialProps(ctx);
    // This is important. It prevents emotion to render invalid HTML.
    // See https://github.com/mui-org/material-ui/issues/26561#issuecomment-855286153
    const emotionStyles = extractCriticalToChunks(initialProps.html);
    const emotionStyleTags = emotionStyles.styles.map((style) => (
      <style
        data-emotion={`${style.key} ${style.ids.join(' ')}`}
        key={style.key}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: style.css }}
      />
    ));

    return {
      ...initialProps,
      emotionStyleTags,
    };
  }

  render(): JSX.Element {
    const { locale } = this.props;
    const [csp, nonce] = generateCsp();

    return (
      <StrictMode>
        <Html lang={locale}>
          <Head>
            <meta charSet="utf-8" />
            <meta name="theme-color" content={muiTheme.palette.primary.main} />
            <meta property="csp-nonce" content={nonce} />
            <meta httpEquiv="Content-Security-Policy" content={csp} />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="shortcut icon" href="/images/favicon.jpg" />
            {/* This is because of the withRouter */}
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
            <link rel="author" href={`/humans.txt`} />
            <link rel="icon" href={`/favicon.jpg`} />
            <link rel="apple-touch-icon" href={`/favicon.jpg`} />
            <link rel="search" href="/api/opensearch" type="application/opensearchdescription+xml" title={TITLE} />
            <meta name="description" content="website created using all-the-things." />
            <meta name="generator" content="all-the-things. https://github.com/mimecuvalo/all-the-things" />
            <OpenGraphMetadata title={TITLE} />
            <StructuredMetaData title={TITLE} nonce={nonce} />
            {/*
              manifest.json provides metadata used when your web app is added to the
              homescreen on Android. See https://developers.google.com/web/fundamentals/web-app-manifest/
            */}
            <link rel="manifest" href={`/manifest.json`} />
            {/* Inject MUI styles first to match with the prepend: true configuration. */}
            {/* @ts-ignore not sure how to fix this yet */}
            {this.props.emotionStyleTags}
          </Head>
          <body>
            <Main />

            <WindowErrorScript nonce={nonce} />

            <NextScript nonce={nonce} />
          </body>
        </Html>
      </StrictMode>
    );
  }
}

// @ts-ignore not sure how to fix this yet
export default withRouter(MyDocument);

// This needs to be filled out by the developer to provide content for the site.
// Learn more here: http://ogp.me/
function OpenGraphMetadata({ contentOwner, content, title, req }) {
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
}

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

// If there is an error that occurs upon page load, i.e. when executing the initial app code,
// then we send the error up to the server via this mechanism.
// Once the app is loaded, then the rest of error reporting goes through error.js -> logError.
function WindowErrorScript({ nonce }: { nonce: string }) {
  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `
        var hasGlobalErrorFired = false;
        window.onerror = function(message, file, line, column, error) {
          if (hasGlobalErrorFired) {
            return;
          }
          hasGlobalErrorFired = true;

          var data = {
            random: Math.random(),
            context: navigator.userAgent,
            message: message,
            file: file,
            line: line,
            column: column,
            url: window.location.href
          };
          var img = new Image();
          img.src = '/api/report-error?data=' + encodeURIComponent(JSON.stringify(data));
        };`,
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
