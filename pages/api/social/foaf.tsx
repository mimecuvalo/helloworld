import type { NextApiRequest, NextApiResponse } from 'next';
import { User, UserRemote } from '@prisma/client';
import { buildUrl, profileUrl } from 'util/url-factory';
import { getLocalUser, getRemoteFriends } from 'social-butterfly/db';

import { createElement } from 'react';
import crypto from 'crypto';
import { renderToString } from 'react-dom/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getLocalUser(req.query.resource as string);
  if (!user) {
    return res.status(404).end();
  }

  const [followers, following] = await getRemoteFriends(req.query.resource as string);

  res.setHeader('Content-Type', 'application/xrd+xml');
  res.send(
    `<?xml version='1.0' encoding='UTF-8'?>` +
      renderToString(<FOAF req={req} user={user} followers={followers} following={following} />)
  );
}

function FOAF({
  followers,
  following,
  user,
  req,
}: {
  followers: UserRemote[];
  following: UserRemote[];
  user: User;
  req: NextApiRequest;
}) {
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
      <PersonalProfileDocument user={user} req={req} />
      <SelfAgent following={following} user={user} req={req} />
      {followers.map((f) => (
        <Agent key={f.profileUrl} follower={f} user={user} req={req} />
      ))}
    </RDF>
  );
}

function PersonalProfileDocument({ user, req }: { user: User; req: NextApiRequest }) {
  const about = { 'rdf:about': '' };
  const resource = { 'rdf:resource': profileUrl(user.username, req) };

  return (
    <XML.PersonalProfileDocument {...about}>
      {/* @ts-ignore this is fine. */}
      <maker {...resource} />
      {/* @ts-ignore this is fine. */}
      <primaryTopic {...resource} />
    </XML.PersonalProfileDocument>
  );
}

function SelfAgent({ following, user, req }: { following: UserRemote[]; user: User; req: NextApiRequest }) {
  const { username, logo } = user;

  const sha1 = crypto.createHash('sha1');
  const emailHash = sha1.update(`mailto:${user.email}`).digest('hex');

  const about = { 'rdf:about': profileUrl(user.username, req) };
  const acctAbout = { 'rdf:about': `${profileUrl(user.username, req)}#acct` };
  const imgAbout = { 'rdf:about': buildUrl({ req, pathname: logo || '' }) };
  const homepageAbout = { 'rdf:resource': buildUrl({ req, pathname: '/' }) };
  const resource = { 'rdf:resource': profileUrl(user.username, req) };

  return (
    <XML.Agent {...about}>
      <XML.mbox_sha1sum>{emailHash}</XML.mbox_sha1sum>
      {/* @ts-ignore this is fine. */}
      <weblog {...resource} />
      {logo ? (
        <FOAFImg>
          <XML.Image {...imgAbout} />
        </FOAFImg>
      ) : null}
      {/* @ts-ignore this is fine. */}
      <account>
        <XML.OnlineAccount {...acctAbout}>
          <XML.accountServiceHomepage {...homepageAbout} />
          <XML.accountName>{username}</XML.accountName>
          <XML.accountProfilePage {...resource} />
          <SIOCAcctOf {...resource} />
          {following.map((f) => (
            <SIOCFollows key={f.profileUrl} {...{ 'rdf:resource': `${f.profileUrl}#acct` }} />
          ))}
        </XML.OnlineAccount>
        {/* @ts-ignore this is fine. */}
      </account>
      {following
        .filter((f) => f.follower)
        .map((f) => (
          /* @ts-ignore this is fine. */
          <knows key={f.profileUrl} {...{ 'rdf:resource': `${f.profileUrl}` }} />
        ))}
    </XML.Agent>
  );
}

function Agent({ follower, user, req }: { follower: UserRemote; user: User; req: NextApiRequest }) {
  const agentAbout = { 'rdf:about': follower.profileUrl };
  const accountAbout = { 'rdf:about': `${follower.profileUrl}#acct` };
  const profileResource = { 'rdf:resource': follower.profileUrl };
  const followsResource = { 'rdf:resource': `${profileUrl(user.username, req)}#acct` };
  const resource = { 'rdf:resource': profileUrl(user.username, req) };

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

// meh.
// eslint-disable-next-line
const createElementFactory = (type: string) => (p: Record<string, any>) => {
  const { children, ...props } = p;
  return createElement(type, props, children);
};

const RDF = createElementFactory('rdf:RDF');
const FOAFImg = createElementFactory('foaf:img');
const SIOCAcctOf = createElementFactory('sioc:account_of');
const SIOCFollows = createElementFactory('sioc:follows');
const XML: { [key: string]: React.ComponentClass<any> } = {};
[
  'PersonalProfileDocument',
  'Agent',
  'mbox_sha1sum',
  'Image',
  'OnlineAccount',
  'accountServiceHomepage',
  'accountName',
  'accountProfilePage',
  // @ts-ignore this is fine, i think...
].forEach((type) => (XML[type] = createElementFactory(type)));
