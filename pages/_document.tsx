import Document, { DocumentContext, DocumentInitialProps, Head, Html, Main, NextScript } from 'next/document';
import { ReactNode, StrictMode } from 'react';
import { createEmotionCache, muiTheme } from 'styles';

import createEmotionServer from '@emotion/server/create-instance';
import crypto from 'crypto';
import { v4 } from 'uuid';
import { withRouter } from 'next/router';

const HOSTNAME = 'www.example.com';
const TITLE = 'Next.js Example';

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
            <link rel="shortcut icon" href="/images/favicon.ico" />
            {/* This is because of the withRouter */}
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
            <link rel="author" href={`/humans.txt`} />
            <link rel="icon" href={`/favicon.ico`} />
            <link rel="apple-touch-icon" href={`/favicon.ico`} />
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
function OpenGraphMetadata({ title }: { title: string }) {
  // TODO(mime): combine with url_factory code.
  const url = `https://${HOSTNAME}`;

  return (
    <>
      <meta property="og:title" content={title} />
      <meta property="og:description" content="page description" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={title} />
      <meta property="og:image" content={`${url}/favicon.ico`} />
    </>
  );
}

// This needs to be filled out by the developer to provide content for the site.
// Learn more here: https://developers.google.com/search/docs/guides/intro-structured-data
function StructuredMetaData({ nonce, title }: { nonce: string; title: string }) {
  // TODO(mime): combine with url_factory code.
  const url = `https://${HOSTNAME}`;

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
            "@id": "${url}"
          },
          "headline": "page title",
          "image": [
            "https://example.com/photos/16x9/photo.jpg"
           ],
          "datePublished": "2015-02-05T08:00:00+08:00",
          "dateModified": "2015-02-05T09:20:00+08:00",
          "author": {
            "@type": "Person",
            "name": "John Doe"
          },
           "publisher": {
            "@type": "Organization",
            "name": "${title}",
            "logo": {
              "@type": "ImageObject",
              "url": "${url}favicon.ico"
            }
          },
          "description": "page description"
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
