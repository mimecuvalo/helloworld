import { F } from '../../shared/i18n';
import HTMLHead from './HTMLHead';
import React from 'react';

// The main wrapper around all of our app's code.
// It's React all the way down!
export default function HTMLBase({
  apolloStateFn,
  appTime,
  appVersion,
  assetPathsByType,
  children,
  csrfToken,
  defaultLocale,
  locale,
  nonce,
  publicUrl,
  title,
  urls,
  user,
}) {
  return (
    <html lang={locale}>
      <HTMLHead nonce={nonce} assetPathsByType={assetPathsByType} title={title} publicUrl={publicUrl} urls={urls} />
      <body>
        <div id="root">{children}</div>
        <ConfigurationScript
          appTime={appTime}
          appVersion={appVersion}
          csrfToken={csrfToken}
          defaultLocale={defaultLocale}
          locale={locale}
          nonce={nonce}
          user={user}
        />
        <WindowErrorScript nonce={nonce} />

        {/*
          TODO(mime): This would be blocked by a CSP policy that doesn't allow inline scripts.
          Try to get a nonce here instead.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__APOLLO_STATE__ = ${JSON.stringify(apolloStateFn()).replace(/</g, '\\u003c')};`,
          }}
        />

        {assetPathsByType['js'].map(path => (
          <script nonce={nonce} key={path} src={path} />
        ))}

        <StructuredMetaData nonce={nonce} title={title} urls={urls} />

        {/*
          This HTML file is a template.
          If you open it directly in the browser, you will see an empty page.

          You can add webfonts, meta tags, or analytics to this file.
          The build step will place the bundled scripts into the <body> tag.

          To begin the development, run `npm start` or `yarn start`.
          To create a production bundle, use `npm run build` or `yarn build`.
        */}

        <noscript>
          <F msg="You need to enable JavaScript to run this app." />
        </noscript>
      </body>
    </html>
  );
}

// Passes key initial, bootstrap data to the client.
function ConfigurationScript({ appTime, appVersion, csrfToken, defaultLocale, locale, nonce, user }) {
  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `
          window.configuration = {
            appTime: ${appTime},
            appVersion: '${appVersion}',
            auth0_client_id: '${process.env.REACT_APP_AUTH0_CLIENT_ID}',
            auth0_domain: '${process.env.REACT_APP_AUTH0_DOMAIN}',
            csrf: '${csrfToken}',
            defaultLocale: '${defaultLocale}',
            locale: '${locale}',
            user: ${JSON.stringify(user)},
          };
        `,
      }}
    />
  );
}

// If there is an error that occurs upon page load, i.e. when executing the initial app code,
// then we send the error up to the server via this mechanism.
// Once the app is loaded, then the rest of error reporting goes through error.js -> logError.
function WindowErrorScript({ nonce }) {
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

// This needs to be filled out by the developer to provide content for the site.
// Learn more here: https://developers.google.com/search/docs/guides/intro-structured-data
function StructuredMetaData({ title, urls, nonce }) {
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
            "@id": "${urls.localUrlForBrowser}"
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
              "url": "${urls.localUrlForBrowser}favicon.ico"
            }
          },
          "description": "page description"
        }
        `,
      }}
    />
  );
}
