import { ApolloProvider, getDataFromTree } from 'react-apollo';
import constants from '../../constants';
import { contentUrl, navUrl } from '../../../shared/util/url_factory';
import createApolloClient from '../../data/apollo_client';
import crypto from 'crypto';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { renderToString } from 'react-dom/server';
import React, { createElement as RcE, PureComponent } from 'react';

export default async (req, res, next) => {
  const apolloClient = await createApolloClient(req);
  res.type('application/atom+xml');

  const feed = (
    <ApolloProvider client={apolloClient}>
      <RSS req={req} />
    </ApolloProvider>
  );

  try {
    await getDataFromTree(feed);
  } catch (ex) {
    next(ex);
    return;
  }

  try {
    res.send(`<?xml version="1.0" encoding="UTF-8"?>` + renderToString(feed));
  } catch (ex) {
    if (ex instanceof NotFoundError) {
      res.sendStatus(404);
    } else {
      next(ex);
    }
    return;
  }
};

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = '404';
  }
}

@graphql(
  gql`
    query FeedAndUserQuery($username: String!) {
      fetchFeed(username: $username) {
        album
        date_created
        date_updated
        name
        section
        title
        username
        view
      }

      fetchPublicUserData(username: $username) {
        description
        email
        favicon
        license
        logo
        name
        title
        username
      }
    }
  `,
  {
    options: ({
      req: {
        query: { username },
      },
    }) => ({
      variables: {
        username,
      },
    }),
  }
)
class RSS extends PureComponent {
  render() {
    const contentOwner = this.props.data.fetchPublicUserData;
    if (!contentOwner) {
      throw new NotFoundError();
    }

    const { req } = this.props;
    const username = req.query.username;
    const feed = this.props.data.fetchFeed;

    const protocolAndHost = req.protocol + '://' + req.get('host');
    const feedUrl = protocolAndHost + req.originalUrl;
    const profileUrl = navUrl(username, protocolAndHost);

    const md5 = crypto.createHash('md5');
    const supId = md5
      .update(feedUrl)
      .digest('hex')
      .slice(0, 10);

    const namespaces = {
      xmlLang: 'en-US',
      xmlns: 'http://www.w3.org/2005/Atom',
      'xmlns:activity': 'http://activitystrea.ms/spec/1.0/',
      'xmlns:poco': 'http://portablecontacts.net/spec/1.0',
      'xmlns:media': 'http://purl.org/syndication/atommedia',
      'xmlns:thr': 'http://purl.org/syndication/thread/1.0',
    };

    return (
      <feed {...namespaces}>
        <generator uri="https://github.com/mimecuvalo/helloworld">Hello, world.</generator>
        <id>{feedUrl}</id>
        <title>{contentOwner.title}</title>
        <subtitle>a hello world site.</subtitle>
        <link rel="self" href={feedUrl} />
        <link rel="alternate" type="text/html" href={profileUrl} />
        <link rel="hub" href={constants.pushHub} />
        <link
          rel="http://api.friendfeed.com/2008/03#sup"
          href={`http://friendfeed.com/api/public-sup.json#${supId}`}
          type="application/json"
        />
        <link rel="license" href={contentOwner.license} />
        {contentOwner.license ? (
          <rights>
            {contentOwner.license === 'http://purl.org/atompub/license#unspecified'
              ? `Copyright ${new Date().getFullYear()} by ${contentOwner.name}`
              : `${constants.licenses[contentOwner.license]['name']}: ${contentOwner.license}`}
          </rights>
        ) : null}
        {feed.length ? <updated>{new Date(feed[0].date_updated).toISOString()}</updated> : null}
        <Author contentOwner={contentOwner} profileUrl={profileUrl} />
        {contentOwner.logo ? <logo>{`${protocolAndHost}${contentOwner.logo}`}</logo> : null}
        <icon>
          {contentOwner.favicon ? `${protocolAndHost}${contentOwner.favicon}` : `${protocolAndHost}/favicon.ico`}
        </icon>

        {feed.map(content => (
          <Entry key={content.name} content={content} req={req} />
        ))}
      </feed>
    );
  }
}

const Author = ({ contentOwner, profileUrl }) => (
  <author>
    {RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/person`)}
    <name>{contentOwner.name}</name>
    <uri>{profileUrl}</uri>
    <email>{contentOwner.email}</email>
    {RcE('poco:preferredusername', {}, contentOwner.username)}
    {RcE('poco:displayname', {}, contentOwner.name)}
    {RcE('poco:emails', {}, [
      RcE('poco:value', {}, contentOwner.email),
      RcE('poco:type', {}, 'home'),
      RcE('poco:primary', {}, 'true'),
    ])}
    {RcE('poco:urls', {}, [
      RcE('poco:value', {}, profileUrl),
      RcE('poco:type', {}, 'profile'),
      RcE('poco:primary', {}, 'true'),
    ])}
  </author>
);

class Entry extends PureComponent {
  render() {
    const { content, req } = this.props;
    const protocolAndHost = req.protocol + '://' + req.get('host');
    const statsImg = `<img src="${protocolAndHost}/api/stats?url=${contentUrl(content)}" />`;
    const viewWithAbsoluteUrls = content.view.replace(/(['"])\/resource/gm, `$1${protocolAndHost}/resource`);
    const html = viewWithAbsoluteUrls + statsImg;

    return (
      <entry>
        <title>{content.title}</title>
        <link href={contentUrl(content, protocolAndHost)} />
        <id>
          {`tag:${req.hostname}` +
            `,${new Date(content.date_created).toISOString().slice(0, 10)}` +
            `:${contentUrl(content)}`}
        </id>
        <content type="html" dangerouslySetInnerHTML={{ __html: html }} />
        <published>{new Date(content.date_created).toISOString()}</published>
        <updated>{new Date(content.date_updated).toISOString()}</updated>
        {RcE('activity:verb', {}, `http://activitystrea.ms/schema/1.0/post`)}
      </entry>
    );
  }
}
