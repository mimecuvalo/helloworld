import { getActivityPubActor, getUserRemoteInfo } from './discover_user';

import { send as activityPubSend } from './activitypub';
import { buildUrl } from './util/url_factory';
import { follow as emailFollow } from './email';
import { mention as emailMention } from './email';
import { fetchJSON } from './util/crawler';
import { nanoid } from 'nanoid';
import { send as salmonSend } from './salmon';
import { sanitizeHTML } from './util/crawler';
import syndicate from './syndicate';

export async function accept(req, contentOwner, userRemote) {
  const id = buildUrl({
    req,
    pathname: '/api/social/activitypub/accept',
    searchParams: { id: nanoid(10), resource: req.body },
  });
  const message = createGenericMessage('Accept', req, id, contentOwner, req.body);
  send(req, userRemote, contentOwner, message);
}

export async function like(req, contentOwner, contentRemote, userRemote, isFavorite) {
  // TODO(mime): add back unfavorite
  const id = buildUrl({
    req,
    pathname: '/api/social/activitypub/like',
    searchParams: { id: nanoid(10), resource: contentRemote.link },
  });
  const message = createGenericMessage('Like', req, id, contentOwner, {
    type: 'Post',
    id: contentRemote.link,
    displayName: contentRemote.title,
    url: contentRemote.link,
  });
  send(req, userRemote, contentOwner, message);
}

export async function follow(req, contentOwner, userRemote, isFollow) {
  // TODO(mime): add back unfollow
  const id = buildUrl({
    req,
    pathname: '/api/social/activitypub/follow',
    searchParams: { id: nanoid(10), resource: userRemote.profile_url },
  });
  const message = createGenericMessage('Follow', req, id, contentOwner, userRemote.profile_url);
  send(req, userRemote, contentOwner, message);
}

export async function reply(req, contentOwner, content, userRemote, mentionedRemoteUsers) {
  const message = await createArticle(req, content, contentOwner, mentionedRemoteUsers);
  send(req, userRemote, contentOwner, message);
}

async function send(req, userRemote, contentOwner, message) {
  try {
    if (userRemote?.activitypub_inbox_url) {
      activityPubSend(req, userRemote, contentOwner, message);
    } else if (userRemote?.salmon_url) {
      salmonSend(req, userRemote, contentOwner, message);
    }
  } catch (ex) {
    // Not a big deal if this fails.
    // TODO(mime): add logging later.
  }
}

export function createGenericMessage(type, req, id, localUser, object, opt_follower) {
  const actor = buildUrl({ req, pathname: '/api/social/activitypub/actor', searchParams: { resource: localUser.url } });

  const json = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type,
    id,
    actor,
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    cc: opt_follower ? [opt_follower.profile_url] : undefined,
    object,
  };

  return json;
}

export async function createArticle(req, localContent, localUser, opt_follower) {
  const messageUrl = buildUrl({
    req,
    pathname: '/api/social/activitypub/message',
    searchParams: { resource: localContent.url },
  });
  const actorUrl = buildUrl({
    req,
    pathname: '/api/social/activitypub/actor',
    searchParams: { resource: localUser.url },
  });
  const statsImgSrc = buildUrl({ req, pathname: '/api/stats', searchParams: { resource: localContent.url } });
  const statsImg = `<img src="${statsImgSrc}" />`;
  const absoluteUrlReplacement = buildUrl({ req, pathname: '/resource' });

  // TODO(mime): this replacement is nite-lite specific...
  const view = localContent.view.replace(/(['"])\/resource/gm, `$1${absoluteUrlReplacement}`) + statsImg;

  let inReplyTo = localContent.thread;
  if (localContent.thread) {
    try {
      const activityObject = await fetchJSON(localContent.thread, {
        Accept: 'application/activity+json',
      });
      if (activityObject) {
        inReplyTo = activityObject.id;
      }
    } catch (ex) {}
  }

  return createGenericMessage(
    'Create',
    req,
    messageUrl,
    localUser,
    {
      id: messageUrl,
      url: localContent.url,
      type: 'Article',
      published: new Date(localContent.createdAt).toISOString(),
      updated: new Date(localContent.updatedAt).toISOString(),
      attributedTo: actorUrl,
      inReplyTo,
      title: localContent.title,
      content: view,
      to: 'https://www.w3.org/ns/activitystreams#Public',
    },
    opt_follower
  );
}

export async function handle(type, options, req, res, activity, user, userRemote) {
  switch (type) {
    case 'Accept':
      // Do nothing.
      break;
    case 'Create':
      await handleCreate(options, req, res, activity, user, userRemote);
      break;
    case 'Follow':
      await handleFollow(options, req, user, userRemote, true);
      break;
    case 'Like':
      await handleLike(options, req, res, activity, userRemote, true);
      break;
    default:
      break;
  }
}

export async function findUserRemote(options, json, res, user) {
  const actorUrl = json.actor;
  let userRemote = await options.getRemoteUserByActor(user.username, actorUrl);
  if (!userRemote) {
    const actorJSON = await getActivityPubActor(actorUrl);
    if (actorJSON.url) {
      const userRemoteInfo = await getUserRemoteInfo(actorJSON.url, user.username);
      await options.saveRemoteUser(userRemoteInfo);
      userRemote = await options.getRemoteUser(user.username, actorJSON.url);
    } else {
      return res.sendStatus(400);
    }
  }

  return userRemote;
}

async function handleFollow(options, req, user, userRemote, isFollow) {
  if (isFollow) {
    await options.saveRemoteUser(Object.assign({}, userRemote.dataValues, { follower: true }));
    emailFollow(req, user.username, user.email, userRemote.profile_url);
  } else {
    if (userRemote.following) {
      await options.saveRemoteUser(Object.assign({}, userRemote.dataValues, { follower: false }));
    } else {
      await options.removeRemoteUser(userRemote);
    }
  }
}

async function handleLike(options, req, res, activity, userRemote, isLike) {
  const localContentUrl = activity.object;
  const { username, name } = await options.getLocalContent(localContentUrl, req);

  if (!name) {
    return res.sendStatus(400);
  }

  const postId = `${userRemote.profile_url},${localContentUrl},favorite`;
  const remoteContent = {
    from_user: userRemote.profile_url,
    local_content_name: name,
    post_id: postId,
    to_username: username,
    type: 'favorite',
    username: userRemote.username,
  };

  if (!isLike) {
    await options.removeRemoteContent(remoteContent);
    return;
  }

  const existingFavorite = await options.getRemoteContent(username, postId);
  if (existingFavorite) {
    return;
  }

  await options.saveRemoteContent(
    Object.assign({}, remoteContent, {
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      link: '',
      title: '',
      view: '',
    })
  );
}

async function handleCreate(options, req, res, activity, user, userRemote) {
  const activityObject = activity.object;
  const atomContent = sanitizeHTML(activityObject.content);

  const existingContentRemote = await options.getRemoteContent(user.username, activityObject.id);

  const contentRemote = {
    id: existingContentRemote?.id || undefined,
    avatar: userRemote.avatar,
    comments_count: parseInt(activityObject.repliesCount),
    comments_updated: new Date(activityObject.repliesUpdated || new Date()),
    content: '',
    createdAt: new Date(activityObject.published || new Date()),
    from_user: userRemote.profile_url,
    from_user_remote_id: userRemote.id,
    creator: userRemote.name,
    link: activityObject.id,
    post_id: activityObject.id,
    title: activityObject.title,
    to_username: user.username,
    updatedAt: new Date(activityObject.updated || new Date()),
    username: userRemote.username,
    view: atomContent,
  };

  if (activityObject.inReplyTo) {
    handleComment(options, req, res, contentRemote, activityObject.inReplyTo);
  } else {
    handlePost(options, req, res, contentRemote, user, activityObject);
  }

  //const repliesCount = activityObject.repliesCount;
  // if (repliesCount) {
  //   // TODO(mime): these used to be known as 'remote-comment' types.
  //   // need to refactor this.
  //   const comments = await retrieveFeed(activityObject.repliesLink);
  //   await parseFeedAndInsertIntoDb(salmon, userRemote, comments);
  // }
}

async function handlePost(options, req, res, contentRemote, user, activityObject) {
  // TODO(mime): need to unify this with activitypub.js, currently salmon specific...
  const wasUserMentioned = activityObject.mentioned || activityObject.attention;

  contentRemote.type = 'post';
  await options.saveRemoteContent(contentRemote);

  if (wasUserMentioned) {
    emailMention(req, 'Remote User', undefined /* fromEmail */, user.email, contentRemote.link);
  }
}

async function handleComment(options, req, res, contentRemote, inReplyTo) {
  const content = await options.getLocalContent(inReplyTo, req);
  if (!content) {
    return res.sendStatus(404);
  }

  contentRemote.type = 'comment';
  contentRemote.local_content_name = content.name;
  await options.saveRemoteContent(contentRemote);

  const contentOwner = await options.getLocalUser(inReplyTo, req);
  await syndicate(req, contentOwner, content, contentRemote, true /* isComment */);
}
