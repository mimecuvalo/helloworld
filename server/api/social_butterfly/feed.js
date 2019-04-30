import constants from '../../../shared/constants';
import { buildUrl, contentUrl, profileUrl } from '../../../shared/util/url_factory';
import endpointWithApollo from '../../util/endpoint_with_apollo';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { NotFoundError } from '../../util/exceptions';
import React, { createElement as RcE, PureComponent } from 'react';

export default async (req, res, next) => {
  const type = 'xml';
  const preamble = `<?xml version="1.0" encoding="UTF-8"?>`;
  return await endpointWithApollo(req, res, next, type, preamble, <ContentFeed req={req} />);
};

@graphql(
  gql`
    query FeedAndUserQuery($username: String!) {
      fetchFeed(username: $username) {
        username
        section
        album
        name
        title
        createdAt
        updatedAt
        comments_count
        comments_updated
        thread
        thread_user
        view
        content
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
class ContentFeed extends PureComponent {
  render() {
    const feed = this.props.data.fetchFeed;
    const contentOwner = this.props.data.fetchPublicUserData;
    const req = this.props.req;
    const updatedAt = feed.length && feed[0].updatedAt;

    return (
      <GenericFeed contentOwner={contentOwner} req={req} updatedAt={updatedAt}>
        {feed.map(content => (
          <Entry key={content.name} content={content} req={req} />
        ))}
      </GenericFeed>
    );
  }
}

export class GenericFeed extends PureComponent {
  render() {
    const contentOwner = this.props.contentOwner;
    if (!contentOwner) {
      throw new NotFoundError();
    }

    const { req, children, isRemote, updatedAt } = this.props;
    const username = contentOwner.username;

    const acct = `acct:${username}@${req.get('host')}`;
    const feedUrl = buildUrl({ req, pathname: req.originalUrl });
    const salmonUrl = buildUrl({ req, pathname: '/api/social/salmon', searchParams: { q: acct } });
    const profile = profileUrl(username, req);

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
        <link rel="alternate" type="text/html" href={profile} />
        <link rel="hub" href={constants.pushHub} />
        <link rel="salmon" href={salmonUrl} />
        <link rel="http://salmon-protocol.org/ns/salmon-replies" href={salmonUrl} />
        <link rel="http://salmon-protocol.org/ns/salmon-mention" href={salmonUrl} />
        <link rel="license" href={contentOwner.license} />
        {contentOwner.license ? (
          <rights>
            {contentOwner.license === 'http://purl.org/atompub/license#unspecified'
              ? `Copyright ${new Date().getFullYear()} by ${contentOwner.name}`
              : `${constants.licenses[contentOwner.license]['name']}: ${contentOwner.license}`}
          </rights>
        ) : null}
        {updatedAt ? <updated>{new Date(updatedAt).toISOString()}</updated> : null}
        <Author contentOwner={contentOwner} profile={profile} />
        {contentOwner.logo ? <logo>{buildUrl({ req, pathname: contentOwner.logo })}</logo> : null}
        <icon>
          {contentOwner.favicon
            ? buildUrl({ req, pathname: contentOwner.favicon })
            : buildUrl({ req, pathname: '/favicon.ico' })}
        </icon>

        {children}
      </feed>
    );
  }
}

const Author = ({ contentOwner, profile }) => (
  <author>
    {RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/person`)}
    <name>{contentOwner.name}</name>
    <uri>{profile}</uri>
    <email>{contentOwner.email}</email>
    {RcE('poco:preferredusername', {}, contentOwner.username)}
    {RcE('poco:displayname', {}, contentOwner.name)}
    {RcE('poco:emails', {}, [
      RcE('poco:value', { key: 'value' }, contentOwner.email),
      RcE('poco:type', { key: 'type' }, 'home'),
      RcE('poco:primary', { key: 'primary' }, 'true'),
    ])}
    {RcE('poco:urls', {}, [
      RcE('poco:value', { key: 'value' }, profile),
      RcE('poco:type', { key: 'type' }, 'profile'),
      RcE('poco:primary', { key: 'primary' }, 'true'),
    ])}
  </author>
);

class Entry extends PureComponent {
  render() {
    const { content, req } = this.props;
    const contentUrlWithoutHost = contentUrl(content);
    const statsImgSrc = buildUrl({ req, pathname: '/api/stats', searchParams: { url: contentUrlWithoutHost } });
    const statsImg = `<img src="${statsImgSrc}" />`;
    const absoluteUrlReplacement = buildUrl({ req, pathname: '/resource' });
    const html =
      '<![CDATA[' + content.view.replace(/(['"])\/resource/gm, `$1${absoluteUrlReplacement}`) + statsImg + ']]>';
    const repliesUrl = buildUrl({ pathname: '/api/social/comments', searchParams: { url: contentUrlWithoutHost } });
    const repliesAttribs = {
      'thr:count': content.comments_count,
      'thr:updated': new Date(content.comments_updated).toISOString(),
    };

    return (
      <entry>
        <title>{content.title}</title>
        <link href={contentUrl(content, req)} />
        <id>
          {`tag:${req.hostname}` +
            `,${new Date(content.createdAt).toISOString().slice(0, 10)}` +
            `:${contentUrl(content)}`}
        </id>
        <content type="html" dangerouslySetInnerHTML={{ __html: html }} />
        <published>{new Date(content.createdAt).toISOString()}</published>
        <updated>{new Date(content.updatedAt).toISOString()}</updated>
        {RcE('activity:verb', {}, `http://activitystrea.ms/schema/1.0/post`)}
        {content.section === 'comments' ? (
          /* XXX(mime): we'll never get here currently because we never render main sections in our feed */
          <>
            {RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/comment`)}

            {/* see endpoint_with_apollo for refXXX transform */}
            {content.thread ? RcE('thr:in-reply-to', { refXXX: content.thread }) : null}

            {content.thread_user ? (
              <>
                <link rel="ostatus:attention" href={content.thread_user} />
                <link rel="mentioned" href={content.thread_user} />
              </>
            ) : null}
          </>
        ) : (
          RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/article`)
        )}
        {content.comments_count ? (
          <link rel="replies" type="application/atom+xml" href={repliesUrl} {...repliesAttribs} />
        ) : null}
      </entry>
    );
  }
}
