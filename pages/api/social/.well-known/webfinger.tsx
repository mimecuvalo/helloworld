import type { NextApiRequest, NextApiResponse } from 'next';
import { buildUrl, profileUrl } from 'util/url-factory';

import { User } from '@prisma/client';
import { createElement } from 'react';
import { getLocalUser } from 'social-butterfly/db';
import { renderToString } from 'react-dom/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getLocalUser(req.query.resource as string);
  if (!user) {
    return res.status(404).end();
  }

  if (req.query.format !== 'xml') {
    return sendWebfingerAsJson(req, res, user);
  }

  res.setHeader('Content-Type', 'application/xrd+xml');
  res.send(`<?xml version='1.0' encoding='UTF-8'?>` + renderToString(<WebFinger req={req} user={user} />));
}

function sendWebfingerAsJson(req: NextApiRequest, res: NextApiResponse, user: User) {
  const accountInfo = getAccountInfo(req, user);
  const logo = buildUrl({ req, pathname: user.logo || user.favicon || '' });

  const json = {
    subject: accountInfo.account,
    aliases: [profileUrl(user.username, req)],
    links: [
      {
        rel: 'http://schemas.google.com/g/2010#updates-from',
        type: 'application/atom+xml',
        href: accountInfo.feedUrl,
      },
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: profileUrl(user.username, req),
      },
      {
        rel: 'http://webfinger.net/rel/avatar',
        type: 'image/jpeg',
        href: logo,
      },
      {
        rel: 'salmon',
        href: accountInfo.salmonUrl,
      },
      {
        rel: 'http://salmon-protocol.org/ns/salmon-replies',
        href: accountInfo.salmonUrl,
      },
      {
        rel: 'http://salmon-protocol.org/ns/salmon-mention',
        href: accountInfo.salmonUrl,
      },
      {
        rel: 'http://ostatus.org/schema/1.0/subscribe',
        href: accountInfo.followUrl,
      },
      {
        rel: 'webmention',
        href: accountInfo.webmentionUrl,
      },
      {
        rel: 'magic-public-key',
        href: `data:application/magic-public-key,${user.magicKey}`,
      },
      {
        rel: 'describedby',
        type: 'application/rdf+xml',
        href: accountInfo.foafUrl,
      },
      {
        rel: 'describedby',
        type: 'application/json',
        href: accountInfo.webfingerUrl,
      },
      {
        rel: 'http://microformats.org/profile/hcard',
        type: 'text/html',
        href: profileUrl(user.username, req),
      },
      {
        rel: 'self',
        type: 'application/activity+json',
        href: accountInfo.actorUrl,
      },
    ],
  };

  return res.json(json);
}

function getAccountInfo(req: NextApiRequest, user: User) {
  const { username } = user;
  const resource = profileUrl(user.username, req);

  const account = `acct:${username}@${req.headers['host']}`;
  const actorUrl = buildUrl({ req, pathname: '/api/social/activitypub/actor', searchParams: { resource } });
  const feedUrl = buildUrl({ req, pathname: '/api/social/feed', searchParams: { resource } });
  const foafUrl = buildUrl({ req, pathname: '/api/social/foaf', searchParams: { resource } });
  const followUrl = buildUrl({ req, pathname: '/api/social/follow', searchParams: { resource } });
  const salmonUrl = buildUrl({ req, pathname: '/api/social/salmon', searchParams: { resource } });
  const webfingerUrl = buildUrl({ req, pathname: '/api/social/webfinger', searchParams: { resource } });
  const webmentionUrl = buildUrl({ req, pathname: '/api/social/webmention', searchParams: { resource } });

  return {
    account,
    actorUrl,
    feedUrl,
    foafUrl,
    followUrl,
    salmonUrl,
    webfingerUrl,
    webmentionUrl,
  };
}

function WebFinger({ req, user }: { req: NextApiRequest; user: User }) {
  const accountInfo = getAccountInfo(req, user);
  const logo = buildUrl({ req, pathname: user.logo || user.favicon || '' });

  return (
    <XML.XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
      <XML.Subject>{accountInfo.account}</XML.Subject>
      <XML.Alias>{profileUrl(user.username, req)}</XML.Alias>
      <XML.Link rel="describedby" href={accountInfo.foafUrl} type="application/rdf+xml" />
      <XML.Link rel="describedby" href={accountInfo.webfingerUrl} type="application/xrd+xml" />
      <XML.Link rel="salmon" href={accountInfo.salmonUrl} />
      <XML.Link rel="http://salmon-protocol.org/ns/salmon-replies" href={accountInfo.salmonUrl} />
      <XML.Link rel="http://salmon-protocol.org/ns/salmon-mention" href={accountInfo.salmonUrl} />
      <XML.Link rel="magic-public-key" href={`data:application/magic-public-key,${user.magicKey}`} />
      <XML.Link rel="webmention" href={accountInfo.webmentionUrl} />
      <XML.Link rel="http://webfinger.net/rel/profile-page" href={profileUrl(user.username, req)} type="text/html" />
      <XML.Link rel="http://webfinger.net/rel/avatar" href={logo} type="image/jpeg" />
      <XML.Link
        rel="http://schemas.google.com/g/2010#updates-from"
        href={accountInfo.feedUrl}
        type="application/atom+xml"
      />
      <XML.Link rel="http://ostatus.org/schema/1.0/subscribe" href={accountInfo.followUrl} />
      <XML.Link rel="http://microformats.org/profile/hcard" href={profileUrl(user.username, req)} type="text/html" />
      <XML.Link rel="self" href={accountInfo.actorUrl} type="application/activity+json" />
    </XML.XRD>
  );
}

// eslint-disable-next-line react/display-name
const createElementFactory = (type: string) => (p: Record<string, any>) => {
  const { children, ...props } = p;
  return createElement(type, props, children);
};

const XML: { [key: string]: React.ComponentClass<any> } = {};
// @ts-ignore this is fine, i think...
['XRD', 'Link', 'Subject', 'Alias'].forEach((type) => (XML[type] = createElementFactory(type)));
