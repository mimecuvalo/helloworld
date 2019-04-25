import { buildUrl, contentUrl, profileUrl } from '../../../shared/util/url_factory';
import models from '../../data/models';
import React, { PureComponent } from 'react';
import { renderToString } from 'react-dom/server';

export default async (req, res) => {
  // The `q` parameter has either a value of the form:
  //   acct:mime@hostname.com
  // or:
  //   /mime/some/url
  const account = req.query.q.replace(/^acct:/, '');

  let username;
  if (account.indexOf('@') !== -1) {
    username = account.split('@')[0];
  } else {
    const parsedUrl = new URL(account);
    username = parsedUrl.pathname.split('/')[0];
  }

  const user = await models.User.findOne({ attributes: ['username', 'magic_key'], where: { username } });
  if (!user) {
    return res.sendStatus(404);
  }

  res.type('application/xrd+xml');
  res.send(`<?xml version='1.0' encoding='UTF-8'?>` + renderToString(<WebFinger req={req} user={user} />));
};

class WebFinger extends PureComponent {
  render() {
    const { req, user } = this.props;
    const { username, magic_key } = user;

    const acct = `acct:${username}@${req.get('host')}`;
    const aboutUrl = contentUrl({ username, section: 'main', name: 'about' }, req);
    const feedUrl = buildUrl({ req, pathname: '/api/social/rss', searchParams: { username } });
    const foafUrl = buildUrl({ req, pathname: '/api/social/foaf', searchParams: { username } });
    const followUrl = buildUrl({ req, pathname: '/api/social/follow', searchParams: { username } });
    const salmonUrl = buildUrl({ req, pathname: '/api/social/salmon', searchParams: { q: acct } });
    const webfingerUrl = buildUrl({ req, pathname: '/api/social/webfinger', searchParams: { q: acct } });
    const webmentionUrl = buildUrl({ req, pathname: '/api/social/webmention', searchParams: { q: acct } });
    const profile = profileUrl(username, req);

    return (
      <XML.XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
        <XML.Subject>{acct}</XML.Subject>
        <XML.Alias>{profile}</XML.Alias>
        <XML.Link rel="describedby" type="application/rdf+xml" href={foafUrl} />
        <XML.Link rel="describedby" type="application/xrd+xml" href={webfingerUrl} />
        <XML.Link rel="salmon" href={salmonUrl} />
        <XML.Link rel="http://salmon-protocol.org/ns/salmon-replies" href={salmonUrl} />
        <XML.Link rel="http://salmon-protocol.org/ns/salmon-mention" href={salmonUrl} />
        <XML.Link rel="magic-public-key" href={`data:application/magic-public-key,${magic_key}`} />
        <XML.Link rel="webmention" href={webmentionUrl} />
        <XML.Link rel="https://webfinger.net/rel/profile-page" href={aboutUrl} type="text/html" />
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
