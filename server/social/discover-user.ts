import { createAbsoluteUrl, fetchJSON, fetchText } from '../crawler';
import { getRemoteUser, saveRemoteUser } from './db';
import type { UserRemote } from '../../generated/prisma/client';
import * as cheerio from 'cheerio';
import { discoverAndParseFeedFromUrl } from './feeds';
import { ensureAbsoluteUrl } from '../../lib/url-factory';
import { AtpAgent } from '@atproto/api';
import { assertionKeyOf } from './integrity-proof';
import { resolveAtprotoIdentity } from './atproto-identity';

export async function getLRDD(url: string) {
  const parsedUrl = new URL(url);
  const hostMetaUrl = `${parsedUrl.protocol}//${parsedUrl.host}/.well-known/host-meta`;

  let lrddUrl, $;
  try {
    const hostMetaXML = await fetchText(hostMetaUrl);
    $ = cheerio.load(hostMetaXML);
    lrddUrl = $('link[rel="lrdd"][type="application/json"]').attr('template');
    if (!lrddUrl) {
      lrddUrl = $('link[rel="lrdd"]').attr('template');
    }
  } catch {
    /* do nothing */
  }

  return lrddUrl;
}

// All the links to different feeds/data about the user.
export async function getWebfinger(lrddUrl: string, uri: string) {
  const webfingerUrl = lrddUrl.replace('{uri}', encodeURIComponent(uri));

  let webfingerDoc, webfingerInfo;
  try {
    webfingerDoc = await fetchText(webfingerUrl);
  } catch {
    try {
      // Fallback: probe username@hostname (some sites like socialhome require it).
      const parsedUrl = new URL(uri);
      const acct = `${parsedUrl.pathname
        .split('/')
        .filter((p) => !!p)
        .slice(-1)}@${parsedUrl.hostname}`;
      const acctWebfingerUrl = lrddUrl.replace('{uri}', encodeURIComponent(acct));
      webfingerDoc = await fetchText(acctWebfingerUrl);
    } catch {
      return null;
    }
  }

  let success = false;
  try {
    const json = JSON.parse(webfingerDoc);
    const linkMap: { [key: string]: HTMLAnchorElement } = {};
    json.links.map((link: HTMLAnchorElement) => (linkMap[link.rel] = link));
    const activityPubActorUrl = json.links.find(
      (link: HTMLAnchorElement) => link.rel === 'self' && link.type === 'application/activity+json'
    );

    webfingerInfo = {
      feedUrl: linkMap['http://schemas.google.com/g/2010#updates-from']?.href,
      salmonUrl: linkMap['salmon']?.href,
      activityPubActorUrl: activityPubActorUrl?.href,
      webmentionUrl: linkMap['webmention']?.href,
      magicKey: (linkMap['magic-public-key']?.href || '').replace('data:application/magic-public-key,', ''),
      profileUrl: json.aliases.find((alias: string) => alias.startsWith('https:') || alias.startsWith('http:')),
      activityPubInboxUrl: '',
      sharedInboxUrl: '',
      ed25519PublicKey: '',
    };
    success = true;
  } catch {
    // Fall through to XML parsing.
  }

  if (!success) {
    try {
      const $ = cheerio.load(webfingerDoc);
      webfingerInfo = {
        feedUrl: $('link[rel="http://schemas.google.com/g/2010#updates-from"]').attr('href'),
        salmonUrl: $('link[rel="salmon"]').attr('href'),
        activityPubActorUrl: $('link[rel="self"][type="application/activity+json"]').attr('href'),
        webmentionUrl: $('link[rel="webmention"]').attr('href'),
        magicKey: $('link[rel="magic-public-key"]')?.attr('href')?.replace('data:application/magic-public-key,', ''),
        profileUrl:
          $('alias').first().text().startsWith('https:') ||
          $('alias').first().text().startsWith('http:') ||
          $('alias').last().text(),
        activityPubInboxUrl: '',
        sharedInboxUrl: '',
        ed25519PublicKey: '',
      };
    } catch {
      return null;
    }
  }

  if (webfingerInfo && webfingerInfo.activityPubActorUrl) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actorJSON = (await getActivityPubActor(webfingerInfo.activityPubActorUrl)) as any;
      // Prefer the PEM public key from the actor JSON over the magic key.
      webfingerInfo.magicKey = actorJSON['publicKey']['publicKeyPem'];
      webfingerInfo.activityPubInboxUrl = actorJSON['inbox'];
      // Several followers on one instance collapse to a single delivery when
      // the actor advertises a shared inbox.
      webfingerInfo.sharedInboxUrl = actorJSON['endpoints']?.['sharedInbox'] || '';
      // The Ed25519 key backing their FEP-8b32 proofs, if they publish one. The
      // RSA key above only ever authenticates a direct delivery; this is what
      // lets an activity of theirs reach us second-hand and still be trusted.
      webfingerInfo.ed25519PublicKey = assertionKeyOf(actorJSON)?.publicKeyMultibase || '';
    } catch {
      // Ignore if we can't get the actor info.
    }
  }

  return webfingerInfo;
}

export async function getActivityPubActor(url: string) {
  return await fetchJSON(url, { Accept: 'application/activity+json' });
}

export async function getHTML(url: string) {
  let $;
  try {
    const html = await fetchText(url);
    $ = cheerio.load(html);
  } catch {
    return null;
  }
  return $;
}

export async function discoverUserRemoteInfoSaveAndSubscribe(url: string, localUsername: string) {
  const userRemote = await getUserRemoteInfo(url, localUsername);

  const existingUserRemote = await getRemoteUser(userRemote.localUsername || '', userRemote.profileUrl || '');
  userRemote.id = existingUserRemote?.id || -1;
  userRemote.following = true;
  await saveRemoteUser(userRemote as UserRemote);

  // TODO(stage 5): WebSub subscribe when userRemote.hubUrl is present.

  return await getRemoteUser(userRemote.localUsername || '', userRemote.profileUrl || '');
}

// Following an AT Protocol account: there is no Atom feed or WebFinger to
// discover, so identity resolution short-circuits the whole path below.
async function getAtprotoUserRemoteInfo(input: string, localUsername: string): Promise<UserRemote | null> {
  const identity = await resolveAtprotoIdentity(input);
  if (!identity) return null;

  const profileUrl = `https://bsky.app/profile/${identity.handle}`;
  let displayName = identity.handle;
  let avatar = '';
  try {
    const agent = new AtpAgent({ service: identity.pdsUrl });
    const profile = await agent.app.bsky.actor.getProfile({ actor: identity.did });
    displayName = profile.data.displayName || identity.handle;
    avatar = profile.data.avatar || '';
  } catch {
    // A profile we can't read still gets followed; it just looks plainer.
  }

  return {
    localUsername,
    username: identity.handle,
    name: displayName,
    profileUrl,
    // No feed URL: the cron branches on atprotoDid and polls XRPC instead.
    feedUrl: '',
    atprotoDid: identity.did,
    atprotoHandle: identity.handle,
    atprotoPdsUrl: identity.pdsUrl,
    avatar,
    favicon: avatar,
    order: Math.pow(2, 31) - 1,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any as UserRemote;
}

export async function getUserRemoteInfo(websiteUrl: string, localUsername: string) {
  const atproto = await getAtprotoUserRemoteInfo(websiteUrl, localUsername);
  if (atproto) return atproto;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userRemote: UserRemote = { localUsername } as any;

  const lrddUrl = await getLRDD(websiteUrl);
  if (lrddUrl) {
    const webfingerInfo = await getWebfinger(lrddUrl, websiteUrl);
    userRemote = Object.assign({}, userRemote, webfingerInfo);
  }

  userRemote.feedUrl = ensureAbsoluteUrl(websiteUrl, userRemote.feedUrl || '');
  const { feedMeta, feedUrl } = await discoverAndParseFeedFromUrl(userRemote.feedUrl || websiteUrl);
  userRemote.feedUrl = feedUrl;

  const htmlDoc = (await getHTML(websiteUrl)) || (() => undefined);
  const atomLinks = feedMeta['atom:link'] ? [feedMeta['atom:link']].flat(1) : [];
  userRemote.profileUrl = userRemote.profileUrl || feedMeta['atom:author']?.['uri']?.['#'] || websiteUrl || '';
  userRemote.hubUrl = atomLinks.find((el) => el['@'].rel === 'hub')?.['@'].href || '';
  userRemote.salmonUrl = userRemote.salmonUrl || atomLinks.find((el) => el['@'].rel === 'salmon')?.['@'].href || '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userRemote.webmentionUrl = userRemote.webmentionUrl || (htmlDoc as any)('link[rel="webmention"]')?.attr('href') || '';
  userRemote.username =
    userRemote.username || feedMeta['atom:author']?.['poco:preferredusername']?.['#'] || feedMeta.title;
  userRemote.name = feedMeta['atom:author']?.['poco:displayname']?.['#'] || '';
  userRemote.favicon =
    feedMeta.favicon ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createAbsoluteUrl(websiteUrl, (htmlDoc as any)('link[rel="shortcut icon"]')?.['href']) ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createAbsoluteUrl(websiteUrl, (htmlDoc as any)('link[rel="icon"]')?.['href']) ||
    createAbsoluteUrl(websiteUrl, '/favicon.jpg');
  userRemote.avatar = feedMeta.image?.url || userRemote.favicon;
  userRemote.order = Math.pow(2, 31) - 1;

  // If activityPubActorUrl not found, fall back to profileUrl (used in Salmon lookups).
  userRemote.activityPubActorUrl = userRemote.activityPubActorUrl || userRemote.profileUrl;

  userRemote.salmonUrl = ensureAbsoluteUrl(websiteUrl, userRemote.salmonUrl || '');
  userRemote.activityPubActorUrl = ensureAbsoluteUrl(websiteUrl, userRemote.activityPubActorUrl || '');
  userRemote.activityPubInboxUrl = ensureAbsoluteUrl(websiteUrl, userRemote.activityPubInboxUrl || '');
  userRemote.sharedInboxUrl = ensureAbsoluteUrl(websiteUrl, userRemote.sharedInboxUrl || '');
  userRemote.webmentionUrl = ensureAbsoluteUrl(websiteUrl, userRemote.webmentionUrl || '');
  userRemote.profileUrl = ensureAbsoluteUrl(websiteUrl, userRemote.profileUrl || '');
  userRemote.feedUrl = ensureAbsoluteUrl(websiteUrl, userRemote.feedUrl);
  userRemote.hubUrl = ensureAbsoluteUrl(websiteUrl, userRemote.hubUrl || '');

  return userRemote;
}
