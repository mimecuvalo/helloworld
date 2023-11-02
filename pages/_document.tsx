import Document, { DocumentContext, DocumentInitialProps, Head, Html, Main, NextScript } from 'next/document';
import { ReactNode, StrictMode } from 'react';

import { createEmotionCache } from 'styles';
import createEmotionServer from '@emotion/server/create-instance';
import crypto from 'crypto';
import { v4 } from 'uuid';

const generateCsp = (nonce: string) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const cspDirectives: { [key: string]: string[] } = {
    'connect-src': isDevelopment
      ? ['*']
      : [
          "'self'",
          'https://*.ingest.sentry.io',
          'https://vitals.vercel-insights.com',
          `https://s3.amazonaws.com/${process.env.S3_AWS_S3_BUCKET_NAME}`,
        ],
    'default-src': ["'self'"],
    'font-src': ["'self'", 'https:'],
    // TODO(mime)
    //'frame-ancestors': ["'self'"],
    'frame-src': ["'self'", 'http:', 'https:'],
    'img-src': ['data:', 'http:', 'https:', 'blob:'],
    'manifest-src': ["'self'"],
    'media-src': ["'self'", 'blob:'],
    'object-src': ["'self'"],
    // 'prefetch-src': ["'self'"],
    // TODO(mime)
    //'report-uri': ['/api/report-csp-violation'],
    'script-src': ["'self'", 'https://cdn.auth0.com', 'https://cdn.vercel-insights.com'].concat(
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

  return csp;
};

export interface CustomDocumentInitialProps extends DocumentInitialProps {
  emotionStyleTags: ReactNode[];
  nonce: string;
}

export default class MyDocument extends Document {
  // Based off of: https://github.com/mui-org/material-ui/blob/master/examples/nextjs/pages/_document.js
  static async getInitialProps(ctx: DocumentContext): Promise<CustomDocumentInitialProps> {
    const originalRenderPage = ctx.renderPage;

    // You can consider sharing the same emotion cache between all the SSR requests to speed up performance.
    // However, be aware that it can have global side effects.
    const cache = createEmotionCache();
    const { extractCriticalToChunks } = createEmotionServer(cache);

    const hash = crypto.createHash('sha256');
    hash.update(v4());
    const nonce = hash.digest('base64');

    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) =>
          function EnhanceApp(props) {
            // @ts-ignore not sure how to fix this yet
            return <App emotionCache={cache} nonce={nonce} {...props} />;
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
      nonce,
    };
  }

  render(): JSX.Element {
    const { locale } = this.props;
    // @ts-ignore not sure how to fix this yet
    const { nonce } = this.props;
    const csp = generateCsp(nonce);

    return (
      <StrictMode>
        <Html lang={locale}>
          <Head>
            <meta charSet="utf-8" />
            <meta property="csp-nonce" content={nonce} />
            <meta httpEquiv="Content-Security-Policy" content={csp} />
            <link rel="author" href={`/humans.txt`} />
            <meta name="generator" content="Hello, world. https://github.com/mimecuvalo/helloworld" />
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
