import { contentUrl, parseContentUrl, profileUrl } from '../../shared/util/url_factory';
import models from '../data/models';
import Sequelize from 'sequelize';
import socialButterfly from 'social-butterfly';

let isSetup = false;
let memoizedExports = {};

const FEED_MAX_DAYS_OLD = 30 * 24 * 60 * 60 * 1000; // 30 days

export default app => {
  if (isSetup) {
    return memoizedExports;
  }

  memoizedExports = socialButterfly({
    app,
    constants: {
      feedMaxDaysOld: FEED_MAX_DAYS_OLD,
      webSubHub: 'https://pubsubhubbub.appspot.com/',
      webSubSecret: process.env.REACT_APP_WEBSUB_SECRET,
      thumbWidth: 154,
      thumbHeight: 115,
    },
    getLocalUser,
    getLocalContent,
    getLocalLatestContent,
    getRemoteUser,
    getRemoteUserByActor,
    saveRemoteUser,
    removeRemoteUser,
    getRemoteAllUsers,
    getRemoteFriends,
    getRemoteContent,
    saveRemoteContent,
    removeOldRemoteContent,
    removeRemoteContent,
    getRemoteCommentsOnLocalContent,
  });

  isSetup = true;

  return memoizedExports.dispose;
};

/**
 * User has these fields:
 *  username
 *  email
 *  url
 *  name (optional)
 *  title (optional)
 *  license (optional)
 *  favicon (optional)
 *  logo (optional)
 *  magic_key (required if you want the Salmon protocol to work)
 *  private_key (required if you want the Salmon protocol to work)
 */
async function getLocalUser(localUserUrl, req) {
  if (!localUserUrl) {
    return null;
  }

  const username = parseContentUrl(localUserUrl).username;
  const localUser = await models.User.findOne({ where: { username } });
  if (localUser) {
    localUser.url = profileUrl(username, req);
  }

  return localUser;
}

/**
 * Content has these fields:
 *  username
 *  name
 *  url
 *  title
 *  createdAt
 *  updatedAt
 *  thumb
 *  comments_count  * probably get rid of
 *  comments_updated
 *  favorites_count  * probably get rid of
 *  favorites_updated
 *  thread
 *  thread_user
 *  avatar * change to logo? needed?
 *  content
 */
async function getLocalContent(localContentUrl, req) {
  const { username, name } = parseContentUrl(localContentUrl);
  const localContent = await models.Content.findOne({ where: { username, name } });
  if (localContent) {
    localContent.url = contentUrl(localContent, req);
  }

  return localContent;
}

/**
 * Same structure as LocalContent, except returns an array of latest content.
 */
async function getLocalLatestContent(localContentUrl, req) {
  const { username } = parseContentUrl(localContentUrl);

  const notEqualToMain = { [Sequelize.Op.ne]: 'main' };
  const contentConstraints = {
    username,
    section: notEqualToMain,
    album: notEqualToMain,
    hidden: false,
    redirect: false,
  };
  const feed = await models.Content.findAll({
    where: contentConstraints,
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  feed.forEach(item => (item.url = contentUrl(item, req)));

  return feed;
}

/**
 * RemoteUser has these fields:
 *  local_username
 *  username
 *  name
 *  profile_url
 *  feed_url
 *  magic_key
 *  salmon_url
 *  activitypub_actor_url
 *  activitypub_inbox_url
 *  webmention_url
 *  hub_url
 *  follower
 *  following
 *  favicon
 *  avatar
 */
async function getRemoteUser(local_username, profile_url) {
  return await models.User_Remote.findOne({
    where: {
      local_username,
      profile_url,
    },
  });
}

/* @see getRemoteUser above. difference here is the url we're referencing. */
async function getRemoteUserByActor(local_username, activitypub_actor_url) {
  return await models.User_Remote.findOne({
    where: {
      local_username,
      activitypub_actor_url,
    },
  });
}

async function saveRemoteUser(remoteUser) {
  return await models.User_Remote.upsert(remoteUser, { validate: true });
}

async function removeRemoteUser(remoteUser) {
  return await models.User_Remote.destroy({ where: { id: remoteUser.id } });
}

/**
 * Same structure as RemoteUser above. Used to retrieve feeds for local users.
 */
async function getRemoteAllUsers() {
  return await models.User_Remote.findAll();
}

/**
 * Friends are the same as RemoteUser's, except they are an array.
 * @return [followers, following]
 */
async function getRemoteFriends(usernameOrUrl) {
  const local_username = parseContentUrl(usernameOrUrl).username;
  const followers = await models.User_Remote.findAll({ where: { local_username, follower: true } });
  const following = await models.User_Remote.findAll({ where: { local_username, following: true } });
  return [followers, following];
}

/**
 * RemoteContent has these fields:
 *  to_username
 *  local_content_name
 *  from_user
 *  comment_user
 *  username
 *  creator
 *  avatar
 *  title
 *  post_id
 *  link
 *  createdAt
 *  updatedAt
 *  comments_count
 *  comments_updated
 *  thread
 *  type
 *  favorited
 *  content
 */
async function getRemoteContent(localUsername, link) {
  return await models.Content_Remote.findOne({
    where: {
      to_username: localUsername,
      link,
    },
  });
}

async function saveRemoteContent(remoteContent) {
  if (remoteContent instanceof Array) {
    return await models.Content_Remote.bulkCreate(remoteContent, { ignoreDuplicates: true, validate: true });
  } else {
    return await models.Content_Remote.upsert(remoteContent, { validate: true });
  }
}

async function removeOldRemoteContent(remoteContent) {
  return await models.Content_Remote.destroy({
    where: {
      type: 'post',
      favorited: false,
      local_content_name: '',
      createdAt: { [Sequelize.Op.lt]: Date.now() - FEED_MAX_DAYS_OLD },
    },
  });
}

async function removeRemoteContent(remoteContent) {
  return await models.Content_Remote.destroy({
    where: remoteContent,
  });
}

async function getRemoteCommentsOnLocalContent(localContentUrl) {
  const { username, name } = parseContentUrl(localContentUrl);
  const result = await models.Content_Remote.findAll({
    where: {
      to_username: username,
      local_content_name: name,
      deleted: false,
      is_spam: false,
      type: 'comment',
    },
    order: [['createdAt', 'DESC']],
  });

  return result;
}
