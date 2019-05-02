import { buildUrl } from '../../../shared/util/url_factory';
import cheerio from 'cheerio';
import constants from '../../../shared/constants';
import { discoverAndParseFeedFromUrl } from '../../util/feeds';
import { fetchText, createAbsoluteUrl } from '../../util/crawler';
import models from '../../data/models';
import pubSubHubSubscriber from './push';

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
export async function getWebfinger(lrddUrl, email) {
  const webfingerUrl = lrddUrl.replace('{uri}', encodeURIComponent(email));

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

export async function discoverUserRemoteInfoSaveAndSubscribe(req, url, local_username) {
  const userRemote = await getUserRemoteInfo(url, local_username);

  const existingUserRemote = await models.User_Remote.findOne({
    where: {
      local_username: userRemote.local_username,
      profile_url: userRemote.profile_url,
    },
  });

  userRemote.id = existingUserRemote?.id || undefined;
  userRemote.following = true;
  await models.User_Remote.upsert(userRemote, { validate: true });

  if (userRemote.hub_url) {
    const userRemoteParams = { local_username: userRemote.local_username, profile_url: userRemote.profile_url };
    const callbackUrl = buildUrl({ req, pathname: '/pubsubhubbub', searchParams: userRemoteParams });
    await pubSubHubSubscriber.subscribe(userRemote.hub_url, constants.pushHub, callbackUrl);
  }

  return userRemote;
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
  userRemote.profile_url = userRemote.profile_url || feedMeta['atom:author']?.['uri'] || websiteUrl;
  userRemote.hub_url = atomLinks.find(el => el['@'].rel === 'hub')?.['@'].href;
  userRemote.salmon_url = userRemote.salmon_url || atomLinks.find(el => el['@'].rel === 'salmon')?.['@'].href;
  userRemote.webmention_url = userRemote.webmention_url || htmlDoc('link[rel="webmention"]').attr('href');
  userRemote.username =
    userRemote.username || feedMeta['atom:author']?.['poco:preferredusername']['#'] || feedMeta.title;
  userRemote.name = feedMeta['atom:author']?.['poco:displayname']['#'] || '';
  userRemote.favicon =
    feedMeta.favicon ||
    createAbsoluteUrl(websiteUrl, htmlDoc('link[rel="shortcut icon"]')['href']) ||
    createAbsoluteUrl(websiteUrl, '/favicon.ico');
  userRemote.avatar = feedMeta.image?.url || userRemote.favicon;
  userRemote.order = Math.pow(2, 31) - 1;

  return userRemote;
}

export function parseUsernameFromAccount(rawAcct) {
  // The `q` parameter has either a value of the form:
  //   acct:mime@hostname.com
  // or:
  //   /mime/some/url
  const account = rawAcct.replace(/^acct:/, '');

  let username;
  if (account.indexOf('@') !== -1) {
    username = account.split('@')[0];
  } else {
    const parsedUrl = new URL(account);
    username = parsedUrl.pathname.split('/')[0];
  }

  return username;
}
