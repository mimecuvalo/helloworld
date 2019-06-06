import { buildUrl } from './util/url_factory';
import crypto from 'crypto';
import React, { PureComponent } from 'react';
import { renderToString } from 'react-dom/server';

export default (options) => async (req, res) => {
  const user = await options.getLocalUser(req.query.url, req);
  if (!user) {
    return res.sendStatus(404);
  }

  const [followers, following] = await options.getRemoteFriends(req.query.url);

  res.type('application/rdf+xml');
  res.send(
    `<?xml version='1.0' encoding='UTF-8'?>` +
      renderToString(<FOAF req={req} user={user} followers={followers} following={following} />)
  );
};

class FOAF extends PureComponent {
  render() {
    const { followers, following, user, req } = this.props;

    const namespaces = {
      xmlns: 'http://xmlns.com/foaf/0.1/',
      'xmlns:bio': 'http://purl.org/vocab/bio/0.1/',
      'xmlns:foaf': 'http://xmlns.com/foaf/0.1/',
      'xmlns:geo': 'http://www.w3.org/2003/01/geo/wgs84_pos#',
      'xmlns:rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      'xmlns:rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
      'xmlns:sioc': 'http://rdfs.org/sioc/ns#',
    };

    return (
      <RDF {...namespaces}>
        <PersonalProfileDocument user={user} />
        <SelfAgent following={following} user={user} req={req} />
        {followers.map(f => (
          <Agent key={f.profile_url} follower={f} user={user} />
        ))}
      </RDF>
    );
  }
}

class PersonalProfileDocument extends PureComponent {
  render() {
    const { user } = this.props;

    const about = { 'rdf:about': '' };
    const resource = { 'rdf:resource': user.url };

    return (
      <XML.PersonalProfileDocument {...about}>
        <maker {...resource} />
        <primaryTopic {...resource} />
      </XML.PersonalProfileDocument>
    );
  }
}

class SelfAgent extends PureComponent {
  render() {
    const { following, user, req } = this.props;
    const { username, logo } = user;

    const sha1 = crypto.createHash('sha1');
    const emailHash = sha1.update(`mailto:${user.email}`).digest('hex');

    const about = { 'rdf:about': user.url };
    const acctAbout = { 'rdf:about': `${user.url}#acct` };
    const imgAbout = { 'rdf:about': buildUrl({ req, pathname: logo || '' }) };
    const homepageAbout = { 'rdf:resource': buildUrl({ req, pathname: '/' }) };
    const resource = { 'rdf:resource': user.url };

    return (
      <XML.Agent {...about}>
        <XML.mbox_sha1sum>{emailHash}</XML.mbox_sha1sum>
        <weblog {...resource} />
        {logo ? (
          <FOAFImg>
            <XML.Image {...imgAbout} />
          </FOAFImg>
        ) : null}
        <account>
          <XML.OnlineAccount {...acctAbout}>
            <XML.accountServiceHomepage {...homepageAbout} />
            <XML.accountName>{username}</XML.accountName>
            <XML.accountProfilePage {...resource} />
            <SIOCAcctOf {...resource} />
            {following.map(f => (
              <SIOCFollows key={f.profile_url} {...{ 'rdf:resource': `${f.profile_url}#acct` }} />
            ))}
          </XML.OnlineAccount>
        </account>
        {following.filter(f => f.follower).map(f => (
          <knows key={f.profile_url} {...{ 'rdf:resource': `${f.profile_url}` }} />
        ))}
      </XML.Agent>
    );
  }
}

class Agent extends PureComponent {
  render() {
    const { follower, user } = this.props;

    const agentAbout = { 'rdf:about': follower.profile_url };
    const accountAbout = { 'rdf:about': `${follower.profile_url}#acct` };
    const profileResource = { 'rdf:resource': follower.profile_url };
    const followsResource = { 'rdf:resource': `${user.url}#acct` };
    const resource = { 'rdf:resource': user.url };

    return (
      <XML.Agent {...agentAbout}>
        {follower ? <knows {...resource} /> : null}
        <account>
          <XML.OnlineAccount {...accountAbout}>
            <XML.accountName>{follower.username}</XML.accountName>
            <XML.accountProfilePage {...profileResource} />
            <SIOCAcctOf {...profileResource} />
            <SIOCFollows {...followsResource} />
          </XML.OnlineAccount>
        </account>
      </XML.Agent>
    );
  }
}

const createElementFactory = type => p => {
  const { children, ...props } = p;
  return React.createElement(type, props, children);
};

const RDF = createElementFactory('rdf:RDF');
const FOAFImg = createElementFactory('foaf:img');
const SIOCAcctOf = createElementFactory('sioc:account_of');
const SIOCFollows = createElementFactory('sioc:follows');
const XML = {};
[
  'PersonalProfileDocument',
  'Agent',
  'mbox_sha1sum',
  'Image',
  'OnlineAccount',
  'accountServiceHomepage',
  'accountName',
  'accountProfilePage',
].forEach(type => (XML[type] = createElementFactory(type)));
