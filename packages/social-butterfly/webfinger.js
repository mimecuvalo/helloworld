import { buildUrl } from './util/url_factory';
import React, { PureComponent } from 'react';
import { renderToString } from 'react-dom/server';

export default (options) => async (req, res) => {
  const user = await options.getLocalUser(req.query.resource, req);
  if (!user) {
    return res.sendStatus(404);
  }

  if (req.query.format !== 'xml') {
    return sendWebfingerAsJson(req, res, user);
  }

  res.type('application/xrd+xml');
  res.send(`<?xml version='1.0' encoding='UTF-8'?>` + renderToString(<WebFinger req={req} user={user} />));
};

function sendWebfingerAsJson(req, res, user) {
  const accountInfo = getAccountInfo(req, user);
  const logo = buildUrl({ req, pathname: user.logo || user.favicon });

  const json = {
    subject: accountInfo.account,
    aliases: [user.url],
    links: [
      {
        rel: 'http://schemas.google.com/g/2010#updates-from',
        type: 'application/atom+xml',
        href: accountInfo.feedUrl,
      },
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: user.url
      },
      {
        rel: 'http://webfinger.net/rel/avatar',
        type: 'image/jpeg',
        href: logo,
      },
      {
        rel: 'salmon',
        href: accountInfo.salmonUrl
      },
      {
        rel: 'http://salmon-protocol.org/ns/salmon-replies',
        href: accountInfo.salmonUrl
      },
      {
        rel: 'http://salmon-protocol.org/ns/salmon-mention',
        href: accountInfo.salmonUrl
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
        href: `data:application/magic-public-key,${user.magic_key}`,
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
        href: user.url,
      },
      {
        rel: 'self',
        type: 'application/activity+json',
        href: accountInfo.actorUrl,
      },
    ]
  };

  return res.json(json);
}

function getAccountInfo(req, user) {
  const { username, magic_key, url } = user;
  const resource = url;

  const account = `acct:${username}@${req.get('host')}`;
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

class WebFinger extends PureComponent {
  render() {
    const { req, user } = this.props;
    const accountInfo = getAccountInfo(req, user);
    const logo = buildUrl({ req, pathname: user.logo || user.favicon });

    return (
      <XML.XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
        <XML.Subject>{accountInfo.account}</XML.Subject>
        <XML.Alias>{user.url}</XML.Alias>
        <XML.Link rel="describedby" href={accountInfo.foafUrl} type="application/rdf+xml" />
        <XML.Link rel="describedby" href={accountInfo.webfingerUrl} type="application/xrd+xml" />
        <XML.Link rel="salmon" href={accountInfo.salmonUrl} />
        <XML.Link rel="http://salmon-protocol.org/ns/salmon-replies" href={accountInfo.salmonUrl} />
        <XML.Link rel="http://salmon-protocol.org/ns/salmon-mention" href={accountInfo.salmonUrl} />
        <XML.Link rel="magic-public-key" href={`data:application/magic-public-key,${user.magic_key}`} />
        <XML.Link rel="webmention" href={accountInfo.webmentionUrl} />
        <XML.Link rel="https://webfinger.net/rel/profile-page" href={user.url} type="text/html" />
        <XML.Link rel="https://webfinger.net/rel/avatar" href={logo} type="image/jpeg" />
        <XML.Link rel="http://schemas.google.com/g/2010#updates-from" href={accountInfo.feedUrl} type="application/atom+xml" />
        <XML.Link rel="http://ostatus.org/schema/1.0/subscribe" href={accountInfo.followUrl} />
        <XML.Link rel="http://microformats.org/profile/hcard" href={user.url} type="text/html" />
        <XML.Link rel="self" href={accountInfo.actorUrl} type="application/activity+json" />
      </XML.XRD>
    );
  }
}

const createElementFactory = type => p => {
  const { children, ...props } = p;
  return React.createElement(type, props, children);
};

const XML = {};
['XRD', 'Link', 'Subject', 'Alias'].forEach(type => (XML[type] = createElementFactory(type)));
