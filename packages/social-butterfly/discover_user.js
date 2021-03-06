import { buildUrl, ensureAbsoluteUrl } from './util/url_factory';
import cheerio from 'cheerio';
import { discoverAndParseFeedFromUrl } from './util/feeds';
import { fetchJSON, fetchText, createAbsoluteUrl } from './util/crawler';

// Get the /.well-known/host-meta resource.
// In other words, get the link to the WebFinger resource.
// We prefer JSON, or XML if JSON is not found.
export async function getLRDD(url) {
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
  } catch (ex) {
  }

  return lrddUrl;
}

// Has all the links to different feeds/data about the user. See webfinger.js for example.
export async function getWebfinger(lrddUrl, uri) {
  const webfingerUrl = lrddUrl.replace('{uri}', encodeURIComponent(uri));

  let webfingerDoc, webfingerInfo;
  try {
    webfingerDoc = await fetchText(webfingerUrl);
  } catch (ex) {
    try {
      // Fallback to probing for username@hostname if possible. Some sites like socialhome require this.
      const parsedUrl = new URL(uri);
      const acct = `${parsedUrl.pathname.split('/').filter(p => !!p).slice(-1)}@${parsedUrl.hostname}`;
      const acctWebfingerUrl = lrddUrl.replace('{uri}', encodeURIComponent(acct));
      webfingerDoc = await fetchText(acctWebfingerUrl);
    } catch (ex) {
      return null;
    }
  }

  let success = false;
  try {
    const json = JSON.parse(webfingerDoc);
    const linkMap = {};
    json.links.map(link => linkMap[link.rel] = link);
    const activityPubActorUrl = json.links.find(link => link.rel === 'self' && link.type === 'application/activity+json');

    webfingerInfo = {
      feed_url: linkMap['http://schemas.google.com/g/2010#updates-from']?.href,
      salmon_url: linkMap['salmon']?.href,
      activitypub_actor_url: activityPubActorUrl?.href,
      webmention_url: linkMap['webmention']?.href,
      magic_key: (linkMap['magic-public-key']?.href || '').replace('data:application/magic-public-key,', ''),
      profile_url: json.aliases.find(alias => alias.startsWith('https:') || alias.startsWith('http:')),
    };
    success = true;
  } catch (ex) {
    // Fall-through, and try XML parsing.
  }

  if (!success) {
    try {
      const $ = cheerio.load(webfingerDoc);

      webfingerInfo = {
        feed_url: $('link[rel="http://schemas.google.com/g/2010#updates-from"]').attr('href'),
        salmon_url: $('link[rel="salmon"]').attr('href'),
        activitypub_actor_url: $('link[rel="self"][type="application/activity+json"]').attr('href'),
        webmention_url: $('link[rel="webmention"]').attr('href'),
        magic_key: $('link[rel="magic-public-key"]').attr('href').replace('data:application/magic-public-key,', ''),
        profile_url: $('alias').first().text().startsWith('https:')
            || $('alias').first().text().startsWith('http:')
            || $('alias').last().text(),
      };
    } catch (ex) {
      return null;
    }
  }

  if (webfingerInfo.activitypub_actor_url) {
    try {
      const actorJSON = await getActivityPubActor(webfingerInfo.activitypub_actor_url);

      // TODO(mime): not the cleanest naming, we're overwriting the magic_key and preferring the PEM from
      // the actor JSON. should rename this field to reflect that it is has magic or PEM format for public key.
      webfingerInfo.magic_key = actorJSON['publicKey']['publicKeyPem'];
      webfingerInfo.activitypub_inbox_url = actorJSON['inbox'];
    } catch (ex) {
      // Ignore, if we can't get the actor info.
    }
  }

  return webfingerInfo;
}

export async function getActivityPubActor(url) {
  return await fetchJSON(url, {
    'Accept': 'application/activity+json',
  });
}

export async function getHTML(url) {
  let $;
  try {
    const html = await fetchText(url);
    $ = cheerio.load(html);
  } catch (ex) {
    return null;
  }

  return $;
}

export async function discoverUserRemoteInfoSaveAndSubscribe(req, options, url, local_username) {
  const userRemote = await getUserRemoteInfo(url, local_username);

  const existingUserRemote = await options.getRemoteUser(userRemote.local_username, userRemote.profile_url);

  userRemote.id = existingUserRemote?.id || undefined;
  userRemote.following = true;
  await options.saveRemoteUser(userRemote);

  if (req && userRemote.hub_url) {
    const userRemoteParams = { localUsername: userRemote.local_username, remoteProfileUrl: userRemote.profile_url };
    const callbackUrl = buildUrl({ req, pathname: '/websub', searchParams: userRemoteParams });
    await options.webSubSubscriberServer.subscribe(userRemote.hub_url, options.constants.webSubHub, callbackUrl);
  }

  return await options.getRemoteUser(userRemote.local_username, userRemote.profile_url);
}

export async function getUserRemoteInfo(websiteUrl, local_username) {
  let userRemote = { local_username };

  const lrddUrl = await getLRDD(websiteUrl);
  if (lrddUrl) {
    const webfingerInfo = await getWebfinger(lrddUrl, websiteUrl);
    userRemote = Object.assign({}, userRemote, webfingerInfo);
  }

  userRemote.feed_url = ensureAbsoluteUrl(websiteUrl, userRemote.feed_url);
  const { feedMeta, feedUrl } = await discoverAndParseFeedFromUrl(userRemote.feed_url || websiteUrl);
  userRemote.feed_url = feedUrl;

  const htmlDoc = await getHTML(websiteUrl);
  const atomLinks = feedMeta['atom:link'] ? [feedMeta['atom:link']].flat(1) : [];
  userRemote.profile_url = userRemote.profile_url || feedMeta['atom:author']?.['uri']?.['#'] || websiteUrl;
  userRemote.hub_url = atomLinks.find(el => el['@'].rel === 'hub')?.['@'].href;
  userRemote.salmon_url = userRemote.salmon_url || atomLinks.find(el => el['@'].rel === 'salmon')?.['@'].href;
  userRemote.webmention_url = userRemote.webmention_url || htmlDoc('link[rel="webmention"]').attr('href');
  userRemote.username =
    userRemote.username || feedMeta['atom:author']?.['poco:preferredusername']?.['#'] || feedMeta.title;
  userRemote.name = feedMeta['atom:author']?.['poco:displayname']?.['#'] || '';
  userRemote.favicon =
    feedMeta.favicon ||
    createAbsoluteUrl(websiteUrl, htmlDoc('link[rel="shortcut icon"]')['href']) ||
    createAbsoluteUrl(websiteUrl, htmlDoc('link[rel="icon"]')['href']) ||
    createAbsoluteUrl(websiteUrl, '/favicon.ico');
  userRemote.avatar = feedMeta.image?.url || userRemote.favicon;
  userRemote.order = Math.pow(2, 31) - 1;

  // If activitypub_actor_url not found, fallback to profile_url. Used in Salmon lookups.
  userRemote.activitypub_actor_url = userRemote.activitypub_actor_url || userRemote.profile_url;

  userRemote.salmon_url = ensureAbsoluteUrl(websiteUrl, userRemote.salmon_url);
  userRemote.activitypub_actor_url = ensureAbsoluteUrl(websiteUrl, userRemote.activitypub_actor_url);
  userRemote.activitypub_inbox_url = ensureAbsoluteUrl(websiteUrl, userRemote.activitypub_inbox_url);
  userRemote.webmention_url = ensureAbsoluteUrl(websiteUrl, userRemote.webmention_url);
  userRemote.profile_url = ensureAbsoluteUrl(websiteUrl, userRemote.profile_url);
  userRemote.feed_url = ensureAbsoluteUrl(websiteUrl, userRemote.feed_url);
  userRemote.hub_url = ensureAbsoluteUrl(websiteUrl, userRemote.hub_url);

  return userRemote;
}