import { buildUrl } from './util/url_factory';
import cheerio from 'cheerio';
import { discoverAndParseFeedFromUrl } from './util/feeds';
import { fetchText, createAbsoluteUrl } from './util/crawler';

// Get the /.well-known/host-meta resource.
// In other words, get the link to the WebFinger resource.
export async function getLRDD(url) {
  const parsedUrl = new URL(url);
  const hostMetaUrl = `${parsedUrl.protocol}//${parsedUrl.host}/.well-known/host-meta`;

  let lrddUrl;
  try {
    const hostMetaXML = await fetchText(hostMetaUrl);
    const $ = cheerio.load(hostMetaXML);
    lrddUrl = $('link[rel="lrdd"]').attr('template');
  } catch (ex) {
    return null;
  }

  return lrddUrl;
}

// Has all the links to different feeds/data about the user. See webfinger.js for example.
export async function getWebfinger(lrddUrl, uri) {
  const webfingerUrl = lrddUrl.replace('{uri}', encodeURIComponent(uri));

  let $;
  try {
    const webfingerXML = await fetchText(webfingerUrl);
    $ = cheerio.load(webfingerXML);
  } catch (ex) {
    return null;
  }

  return $;
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
    const callbackUrl = buildUrl({ req, pathname: '/pubsubhubbub', searchParams: userRemoteParams });
    await options.pushSubscriberServer.subscribe(userRemote.hub_url, options.constants.pushHub, callbackUrl);
  }

  return await options.getRemoteUser(userRemote.local_username, userRemote.profile_url);
}

export async function getUserRemoteInfo(websiteUrl, local_username) {
  const userRemote = { local_username };

  const lrddUrl = await getLRDD(websiteUrl);
  if (lrddUrl) {
    const webfingerDoc = await getWebfinger(lrddUrl, websiteUrl);
    userRemote.feed_url = webfingerDoc('link[rel="http://schemas.google.com/g/2010#updates-from"]').attr('href');
    userRemote.salmon_url = webfingerDoc('link[rel="salmon"]').attr('href');
    userRemote.webmention_url = webfingerDoc('link[rel="webmention"]').attr('href');
    userRemote.magic_key = webfingerDoc('link[rel="magic-public-key"]')
      .attr('href')
      .replace('data:application/magic-public-key,', '');
    userRemote.username = webfingerDoc('Property[type="http://apinamespace.org/atom/username"]').text();
    userRemote.profile_url = webfingerDoc('alias').text();
  }

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
    createAbsoluteUrl(websiteUrl, '/favicon.ico');
  userRemote.avatar = feedMeta.image?.url || userRemote.favicon;
  userRemote.order = Math.pow(2, 31) - 1;

  return userRemote;
}