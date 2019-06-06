import { buildUrl } from './util/url_factory';
import React, { PureComponent } from 'react';
import { renderToString } from 'react-dom/server';

export default (options) => async (req, res) => {
  const user = await options.getLocalUser(req.query.account, req);
  if (!user) {
    return res.sendStatus(404);
  }

  res.type('application/xrd+xml');
  res.send(`<?xml version='1.0' encoding='UTF-8'?>` + renderToString(<WebFinger req={req} user={user} />));
};

class WebFinger extends PureComponent {
  render() {
    const { req, user } = this.props;
    const { username, magic_key, url } = user;

    const account = `acct:${username}@${req.get('host')}`;
    const feedUrl = buildUrl({ req, pathname: '/api/social/feed', searchParams: { url } });
    const foafUrl = buildUrl({ req, pathname: '/api/social/foaf', searchParams: { url } });
    const followUrl = buildUrl({ req, pathname: '/api/social/follow', searchParams: { url } });
    const salmonUrl = buildUrl({ req, pathname: '/api/social/salmon', searchParams: { account } });
    const webfingerUrl = buildUrl({ req, pathname: '/api/social/webfinger', searchParams: { account } });
    const webmentionUrl = buildUrl({ req, pathname: '/api/social/webmention', searchParams: { account } });

    return (
      <XML.XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
        <XML.Subject>{account}</XML.Subject>
        <XML.Alias>{url}</XML.Alias>
        <XML.Link rel="describedby" type="application/rdf+xml" href={foafUrl} />
        <XML.Link rel="describedby" type="application/xrd+xml" href={webfingerUrl} />
        <XML.Link rel="salmon" href={salmonUrl} />
        <XML.Link rel="http://salmon-protocol.org/ns/salmon-replies" href={salmonUrl} />
        <XML.Link rel="http://salmon-protocol.org/ns/salmon-mention" href={salmonUrl} />
        <XML.Link rel="magic-public-key" href={`data:application/magic-public-key,${magic_key}`} />
        <XML.Link rel="webmention" href={webmentionUrl} />
        <XML.Link rel="https://webfinger.net/rel/profile-page" href={url} type="text/html" />
        <XML.Link rel="http://schemas.google.com/g/2010#updates-from" type="application/atom+xml" href={feedUrl} />
        <XML.Link rel="http://ostatus.org/schema/1.0/subscribe" template={followUrl} />
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
