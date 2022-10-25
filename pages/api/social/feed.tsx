import { Content, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import React, { createElement as RcE, ReactNode } from 'react';
import { buildUrl, contentUrl, profileUrl } from 'util/url-factory';
import constants, { WEB_SUB_HUB } from 'util/constants';
import { getLocalLatestContent, getLocalUser } from 'social-butterfly/db';

import { HTTPError } from 'util/exceptions';
import { renderToString } from 'react-dom/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const contentOwner = await getLocalUser(req.query.resource as string);
  if (!contentOwner) {
    return res.status(404).end();
  }
  const feed = await getLocalLatestContent(req.query.resource as string);

  let renderedTree =
    `<?xml version='1.0' encoding='UTF-8'?>` +
    renderToString(<ContentFeed req={req} feed={feed} contentOwner={contentOwner} />);
  // XXX(mime): in the feeds I have some attributes that are `ref`. However, ref isn't allowed in React,
  // so in the DOM they are `refXXX`. Return them to normal here, sigh.
  renderedTree = renderedTree.replace(/refXXX="([^"]+)"/g, 'ref="$1"');

  res.setHeader('Content-Type', 'xml');
  res.send(renderedTree);
}

function ContentFeed({ feed, contentOwner, req }: { feed: Content[]; contentOwner: User; req: NextApiRequest }) {
  const updatedAt = feed.length ? feed[0].updatedAt : new Date();

  return (
    <GenericFeed contentOwner={contentOwner} req={req} updatedAt={updatedAt}>
      {feed.map((content) => (
        <Entry key={content.name} content={content} req={req} />
      ))}
    </GenericFeed>
  );
}

export function GenericFeed({
  req,
  children,
  contentOwner,
  updatedAt,
}: {
  req: NextApiRequest;
  children: ReactNode;
  contentOwner: User;
  updatedAt?: Date | null;
}) {
  if (!contentOwner) {
    throw new HTTPError(404, undefined, 'feed: no content owner');
  }

  const feedUrl = buildUrl({ req, pathname: req.url || '' });
  const salmonUrl = buildUrl({
    req,
    pathname: '/api/social/salmon',
    searchParams: { resource: profileUrl(contentOwner.username, req) },
  });

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
      <link rel="alternate" type="text/html" href={profileUrl(contentOwner.username, req)} />
      <link rel="hub" href={WEB_SUB_HUB} />
      <link rel="salmon" href={salmonUrl} />
      <link rel="http://salmon-protocol.org/ns/salmon-replies" href={salmonUrl} />
      <link rel="http://salmon-protocol.org/ns/salmon-mention" href={salmonUrl} />
      <link rel="license" href={contentOwner.license || ''} />
      {contentOwner.license ? (
        <rights>
          {contentOwner.license === 'http://purl.org/atompub/license#unspecified'
            ? `Copyright ${new Date().getFullYear()} by ${contentOwner.name}`
            : // @ts-ignore this is fine.
              `${constants.licenses[contentOwner.license]?.['name']}: ${contentOwner.license}`}
        </rights>
      ) : null}
      {updatedAt ? <updated>{new Date(updatedAt).toISOString()}</updated> : null}
      <Author contentOwner={contentOwner} req={req} />
      {contentOwner.logo ? <logo>{buildUrl({ req, pathname: contentOwner.logo })}</logo> : null}
      <icon>
        {contentOwner.favicon
          ? buildUrl({ req, pathname: contentOwner.favicon })
          : buildUrl({ req, pathname: '/favicon.jpg' })}
      </icon>

      {children}
    </feed>
  );
}

const Author = ({ contentOwner, req }: { contentOwner: User; req: NextApiRequest }) => (
  <author>
    {RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/person`)}
    <name>{contentOwner.name}</name>
    <uri>{profileUrl(contentOwner.username, req)}</uri>
    <email>{contentOwner.email}</email>
    {RcE('poco:preferredusername', {}, contentOwner.username)}
    {RcE('poco:displayname', {}, contentOwner.name)}
    {RcE('poco:emails', {}, [
      RcE('poco:value', { key: 'value' }, contentOwner.email),
      RcE('poco:type', { key: 'type' }, 'home'),
      RcE('poco:primary', { key: 'primary' }, 'true'),
    ])}
    {RcE('poco:urls', {}, [
      RcE('poco:value', { key: 'value' }, profileUrl(contentOwner.username, req)),
      RcE('poco:type', { key: 'type' }, 'profile'),
      RcE('poco:primary', { key: 'primary' }, 'true'),
    ])}
  </author>
);

function Entry({ content, req }: { content: Content; req: NextApiRequest }) {
  const statsImgSrc = buildUrl({ req, pathname: '/api/stats', searchParams: { resource: contentUrl(content, req) } });
  const statsImg = `<img src="${statsImgSrc}" />`;
  const absoluteUrlReplacement = buildUrl({ req, pathname: '/resource' });

  // TODO(mime): this replacement is nite-lite specific...
  const html =
    '<![CDATA[' + content.view.replace(/(['"])\/resource/gm, `$1${absoluteUrlReplacement}`) + statsImg + ']]>';
  const repliesUrl = buildUrl({
    pathname: '/api/social/comments',
    searchParams: { resource: contentUrl(content, req) },
  });
  const repliesAttribs = {
    'thr:count': content.commentsCount,
    'thr:updated': new Date(content.commentsUpdated || '').toISOString(),
  };

  return (
    <entry>
      <title>{content.title}</title>
      <link href={contentUrl(content, req)} />
      <id>{contentUrl(content, req)}</id>
      <content type="html" dangerouslySetInnerHTML={{ __html: html }} />
      <published>{new Date(content.createdAt || '').toISOString()}</published>
      <updated>{new Date(content.updatedAt || '').toISOString()}</updated>
      {RcE('activity:verb', {}, `http://activitystrea.ms/schema/1.0/post`)}
      {content.section === 'comments' ? (
        /* XXX(mime): we'll never get here currently because we never render main sections in our feed */
        <>
          {RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/comment`)}

          {/* see endpoint_with_apollo for refXXX transform */}
          {content.thread ? RcE('thr:in-reply-to', { refXXX: content.thread }) : null}

          {content.threadUser ? (
            <>
              <link rel="ostatus:attention" href={content.threadUser} />
              <link rel="mentioned" href={content.threadUser} />
            </>
          ) : null}
        </>
      ) : (
        RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/article`)
      )}
      {content.commentsCount ? (
        <link rel="replies" type="application/atom+xml" href={repliesUrl} {...repliesAttribs} />
      ) : null}
    </entry>
  );
}
