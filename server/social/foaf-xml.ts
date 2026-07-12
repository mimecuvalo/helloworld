import crypto from 'crypto';
import type { User, UserRemote } from '../../generated/prisma/client';
import { buildUrl, profileUrl } from '../../lib/url-factory';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function selfAgentXml(host: string, user: User, following: UserRemote[]): string {
  const profile = profileUrl(user.username, host);
  const emailHash = crypto.createHash('sha1').update(`mailto:${user.email}`).digest('hex');

  const followsAccts = following.map((f) => `<sioc:follows rdf:resource="${esc(f.profileUrl)}#acct"/>`).join('');
  const knows = following
    .filter((f) => f.follower)
    .map((f) => `<knows rdf:resource="${esc(f.profileUrl)}"/>`)
    .join('');

  return (
    `<Agent rdf:about="${esc(profile)}">` +
    `<mbox_sha1sum>${esc(emailHash)}</mbox_sha1sum>` +
    `<weblog rdf:resource="${esc(profile)}"/>` +
    (user.logo ? `<foaf:img><Image rdf:about="${esc(buildUrl({ host, pathname: user.logo }))}"/></foaf:img>` : '') +
    `<account>` +
    `<OnlineAccount rdf:about="${esc(profile)}#acct">` +
    `<accountServiceHomepage rdf:resource="${esc(buildUrl({ host, pathname: '/' }))}"/>` +
    `<accountName>${esc(user.username)}</accountName>` +
    `<accountProfilePage rdf:resource="${esc(profile)}"/>` +
    `<sioc:account_of rdf:resource="${esc(profile)}"/>` +
    followsAccts +
    `</OnlineAccount>` +
    `</account>` +
    knows +
    `</Agent>`
  );
}

function followerAgentXml(host: string, user: User, follower: UserRemote): string {
  const profile = profileUrl(user.username, host);
  return (
    `<Agent rdf:about="${esc(follower.profileUrl)}">` +
    `<knows rdf:resource="${esc(profile)}"/>` +
    `<account>` +
    `<OnlineAccount rdf:about="${esc(follower.profileUrl)}#acct">` +
    `<accountName>${esc(follower.username)}</accountName>` +
    `<accountProfilePage rdf:resource="${esc(follower.profileUrl)}"/>` +
    `<sioc:account_of rdf:resource="${esc(follower.profileUrl)}"/>` +
    `<sioc:follows rdf:resource="${esc(profile)}#acct"/>` +
    `</OnlineAccount>` +
    `</account>` +
    `</Agent>`
  );
}

export function renderFoaf(host: string, user: User, followers: UserRemote[], following: UserRemote[]): string {
  const profile = profileUrl(user.username, host);
  const ns =
    ` xmlns="http://xmlns.com/foaf/0.1/"` +
    ` xmlns:bio="http://purl.org/vocab/bio/0.1/"` +
    ` xmlns:foaf="http://xmlns.com/foaf/0.1/"` +
    ` xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"` +
    ` xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"` +
    ` xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"` +
    ` xmlns:sioc="http://rdfs.org/sioc/ns#"`;

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rdf:RDF${ns}>` +
    `<PersonalProfileDocument rdf:about="">` +
    `<maker rdf:resource="${esc(profile)}"/>` +
    `<primaryTopic rdf:resource="${esc(profile)}"/>` +
    `</PersonalProfileDocument>` +
    selfAgentXml(host, user, following) +
    followers.map((f) => followerAgentXml(host, user, f)).join('') +
    `</rdf:RDF>`
  );
}
