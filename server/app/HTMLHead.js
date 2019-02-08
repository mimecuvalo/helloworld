import { absoluteUrl, contentUrl } from '../../shared/util/url_factory';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';

@graphql(
  gql`
    query ContentAndUserQuery($username: String!, $name: String!) {
      fetchContent(username: $username, name: $name) {
        username
        section
        album
        name
        thumb
        title
      }

      fetchPublicUserData(username: $username) {
        description
        favicon
        theme
        title
        username
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
          username: probableContentUsername,
          name: probableContentName,
        },
      };
    },
  }
)
class HTMLHead extends PureComponent {
  render() {
    const { appName, assetPathsByType, nonce, publicUrl, req } = this.props;
    const contentOwner = this.props.data.fetchPublicUserData;
    const content = this.props.data.fetchContent;

    let description, favicon, rss, theme, title;
    if (contentOwner) {
      description = contentOwner.description && <meta name="description" content={contentOwner.description} />;
      favicon = contentOwner.favicon;
      rss = (
        <link
          rel="alternate"
          type="application/atom+xml"
          title={title}
          href={`/api/social/rss?username=${contentOwner.username}`}
        />
      );
      theme = contentOwner.theme && <link rel="stylesheet" href={contentOwner.theme} />;
      title = contentOwner.title;
    }

    if (!title) {
      title = appName;
    }

    return (
      <head>
        <meta charSet="utf-8" />
        <link rel="author" href={`${publicUrl}humans.txt`} />
        <link rel="shortcut icon" href={favicon || `${publicUrl}favicon.ico`} />
        {assetPathsByType['css'].map(path => (
          <link nonce={nonce} rel="stylesheet" key={path} href={path} />
        ))}
        {theme}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        <link rel="search" href="/api/opensearch" type="application/opensearchdescription+xml" title={title} />
        <link rel="canonical" href={content && contentUrl(content)} />
        {rss}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="generator" content="Hello, world. https://github.com/mimecuvalo/helloworld" />
        {description}
        <OpenGraphMetadata contentOwner={contentOwner} content={content} req={req} />
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
}

// This needs to be filled out by the developer to provide content for the site.
// Learn more here: http://ogp.me/
const OpenGraphMetadata = React.memo(function OpenGraphMetadata({ contentOwner, content, req }) {
  let thumb;
  if (content?.thumb) {
    thumb = content.thumb;
    if (!/^https?:/.test(thumb)) {
      thumb = absoluteUrl(req, thumb);
    }
  }

  return (
    <>
      <meta property="og:title" content={content?.title} />
      <meta property="og:description" content={contentOwner?.description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={content && contentUrl(content, req)} />
      <meta property="og:site_name" content={contentOwner?.title} />
      <meta property="og:image" content={thumb} />
    </>
  );
});

export default HTMLHead;
