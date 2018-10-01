import React from 'react';

export default function HTMLHead({ nonce, assetPathsByType, title, urls, publicUrl }) {
  return (
    <head>
      <meta charSet="utf-8" />
      <link rel="author" href={`${publicUrl}humans.txt`} />
      <link rel="shortcut icon" href={`${publicUrl}favicon.ico`} />
      {assetPathsByType['css'].map(path => (
        <link nonce={nonce} rel="stylesheet" key={path} href={path} />
      ))}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <link rel="search" href="/api/opensearch" type="application/opensearchdescription+xml" title={title} />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta name="theme-color" content="#000000" />
      <OpenGraphMetadata title={title} urls={urls} />
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
      <title>{title}</title>
    </head>
  );
}

// This needs to be filled out by the developer to provide content for the site.
// Learn more here: http://ogp.me/
function OpenGraphMetadata({ title, urls }) {
  return (
    <>
      <meta property="og:title" content="page title" />
      <meta property="og:description" content="page description" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={urls.localUrlForBrowser} />
      <meta property="og:site_name" content={title} />
      <meta property="og:image" content={`${urls.localUrlForBrowser}favicon.ico`} />
    </>
  );
}
