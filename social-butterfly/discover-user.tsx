import { createAbsoluteUrl, fetchJSON, fetchText } from 'util/crawler';
import { getRemoteUser, saveRemoteUser } from './db';

import { NextApiRequest } from 'next';
import { UserRemote } from '@prisma/client';
import cheerio from 'cheerio';
import { discoverAndParseFeedFromUrl } from './feeds';
import { ensureAbsoluteUrl } from 'util/url-factory';

// Get the /.well-known/host-meta resource.
// In other words, get the link to the WebFinger resource.
// We prefer JSON, or XML if JSON is not found.
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

// Has all the links to different feeds/data about the user. See webfinger.js for example.
export async function getWebfinger(lrddUrl: string, uri: string) {
  const webfingerUrl = lrddUrl.replace('{uri}', encodeURIComponent(uri));

  let webfingerDoc, webfingerInfo;
  try {
    webfingerDoc = await fetchText(webfingerUrl);
  } catch {
    try {
      // Fallback to probing for username@hostname if possible. Some sites like socialhome require this.
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
    };
    success = true;
  } catch {
    // Fall-through, and try XML parsing.
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
      };
    } catch {
      return null;
    }
  }

  if (webfingerInfo && webfingerInfo.activityPubActorUrl) {
    try {
      // TODO: type later
      const actorJSON = (await getActivityPubActor(webfingerInfo.activityPubActorUrl)) as unknown as any;

      // TODO(mime): not the cleanest naming, we're overwriting the magic_key and preferring the PEM from
      // the actor JSON. should rename this field to reflect that it is has magic or PEM format for public key.
      webfingerInfo.magicKey = actorJSON['publicKey']['publicKeyPem'];
      webfingerInfo.activityPubInboxUrl = actorJSON['inbox'];
    } catch {
      // Ignore, if we can't get the actor info.
    }
  }

  return webfingerInfo;
}

export async function getActivityPubActor(url: string) {
  return await fetchJSON(url, {
    Accept: 'application/activity+json',
  });
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

export async function discoverUserRemoteInfoSaveAndSubscribe(req: NextApiRequest, url: string, localUsername: string) {
  const userRemote = await getUserRemoteInfo(url, localUsername);

  const existingUserRemote = await getRemoteUser(userRemote.localUsername || '', userRemote.profileUrl || '');

  userRemote.id = existingUserRemote?.id || -1;
  userRemote.following = true;
  await saveRemoteUser(userRemote as UserRemote);

  // TODO(mime)
  // if (req && userRemote.hubUrl) {
  //   const userRemoteParams = { localUsername: userRemote.localUsername, remoteProfileUrl: userRemote.profileUrl };
  //   const callbackUrl = buildUrl({ req, pathname: '/websub', searchParams: userRemoteParams });
  //   await webSubSubscriberServer.subscribe(userRemote.hubUrl, WEB_SUB_HUB, callbackUrl);
  // }

  return await getRemoteUser(userRemote.localUsername || '', userRemote.profileUrl || '');
}

export async function getUserRemoteInfo(websiteUrl: string, localUsername: string) {
  // @ts-ignore meh this is fine.
  let userRemote: UserRemote = { localUsername };

  const lrddUrl = await getLRDD(websiteUrl);
  if (lrddUrl) {
    const webfingerInfo = await getWebfinger(lrddUrl, websiteUrl);
    userRemote = Object.assign({}, userRemote, webfingerInfo);
  }

  userRemote.feedUrl = ensureAbsoluteUrl(websiteUrl, userRemote.feedUrl || '');
  const { feedMeta, feedUrl } = await discoverAndParseFeedFromUrl(userRemote.feedUrl || websiteUrl);
  userRemote.feedUrl = feedUrl;

  const htmlDoc =
    (await getHTML(websiteUrl)) ||
    (() => {
      /* do nothing */
    });
  const atomLinks = feedMeta['atom:link'] ? [feedMeta['atom:link']].flat(1) : [];
  userRemote.profileUrl = userRemote.profileUrl || feedMeta['atom:author']?.['uri']?.['#'] || websiteUrl || '';
  userRemote.hubUrl = atomLinks.find((el) => el['@'].rel === 'hub')?.['@'].href || '';
  userRemote.salmonUrl = userRemote.salmonUrl || atomLinks.find((el) => el['@'].rel === 'salmon')?.['@'].href || '';
  userRemote.webmentionUrl = userRemote.webmentionUrl || htmlDoc('link[rel="webmention"]')?.attr('href') || '';
  userRemote.username =
    userRemote.username || feedMeta['atom:author']?.['poco:preferredusername']?.['#'] || feedMeta.title;
  userRemote.name = feedMeta['atom:author']?.['poco:displayname']?.['#'] || '';
  userRemote.favicon =
    feedMeta.favicon ||
    // @ts-ignore no idea.
    createAbsoluteUrl(websiteUrl, htmlDoc('link[rel="shortcut icon"]')?.['href']) ||
    // @ts-ignore no idea.
    createAbsoluteUrl(websiteUrl, htmlDoc('link[rel="icon"]')?.['href']) ||
    createAbsoluteUrl(websiteUrl, '/favicon.jpg');
  userRemote.avatar = feedMeta.image?.url || userRemote.favicon;
  userRemote.order = Math.pow(2, 31) - 1;

  // If activityPubActorUrl not found, fallback to profileUrl. Used in Salmon lookups.
  userRemote.activityPubActorUrl = userRemote.activityPubActorUrl || userRemote.profileUrl;

  userRemote.salmonUrl = ensureAbsoluteUrl(websiteUrl, userRemote.salmonUrl || '');
  userRemote.activityPubActorUrl = ensureAbsoluteUrl(websiteUrl, userRemote.activityPubActorUrl || '');
  userRemote.activityPubInboxUrl = ensureAbsoluteUrl(websiteUrl, userRemote.activityPubInboxUrl || '');
  userRemote.webmentionUrl = ensureAbsoluteUrl(websiteUrl, userRemote.webmentionUrl);
  userRemote.profileUrl = ensureAbsoluteUrl(websiteUrl, userRemote.profileUrl || '');
  userRemote.feedUrl = ensureAbsoluteUrl(websiteUrl, userRemote.feedUrl);
  userRemote.hubUrl = ensureAbsoluteUrl(websiteUrl, userRemote.hubUrl || '');

  return userRemote;
}
