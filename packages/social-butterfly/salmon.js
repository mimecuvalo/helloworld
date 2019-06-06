import { buildUrl } from './util/url_factory';
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import { follow as emailFollow } from './email';
import { getUserRemoteInfo } from './discover_user';
import magic from 'magic-signatures';
import { mention as emailMention } from './email';
import React, { createElement as RcE, PureComponent } from 'react';
import { renderToString } from 'react-dom/server';
import { sanitizeHTML } from './util/crawler';
import syndicate from './syndicate';

export async function follow(req, contentOwner, salmonUrl, isFollow) {
  const action = isFollow ? 'follow' : 'unfollow';
  send(
    req,
    contentOwner,
    salmonUrl,
    <Salmon req={req} action={action} title={action} atomContent={action} verb={action} />
  );
}

export async function favorite(req, contentOwner, contentRemote, salmonUrl, isFavorite) {
  const action = isFavorite ? 'favorite' : 'unfavorite';
  const activityObject = RcE(
    'activity:object',
    {},
    RcE('activity:object-type', {}, 'http://activitystrea.ms/schema/1.0/note'),
    <id>{contentRemote.post_id}</id>,
    <title />,
    <content type="html" />
  );
  send(
    req,
    contentOwner,
    salmonUrl,
    <Salmon
      req={req}
      activityObject={activityObject}
      action={action}
      title={action}
      atomContent={action}
      verb={action}
    />
  );
}

export async function reply(req, contentOwner, content, salmonUrl, mentionedRemoteUsers) {
  const objectType = content.section === 'comments' ? 'comment' : 'note';
  const repliesUrl = buildUrl({ pathname: '/api/social/comments', searchParams: { url: content.url } });
  const activityObject = (
    <>
      {RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/${objectType}`)}
      <link href={content.url} rel="alternate" type="text/html" />
      {mentionedRemoteUsers.map(mentionedRemoteUser => (
        <>
          <link href={mentionedRemoteUser.profile_url} rel="ostatus:attention" />
          <link href={mentionedRemoteUser.profile_url} rel="mentioned" />
        </>
      ))}

      {/* see endpoint_with_apollo for refXXX transform */}
      {content.thread ? RcE('thr:in-reply-to', { refXXX: content.thread }) : null}
      {content.comments_count
        ? RcE('thr:replies', {
            type: 'application/atom+xml',
            href: repliesUrl,
            count: content.comments_count,
            updated: new Date(content.comments_updated).toISOString(),
          })
        : null}
    </>
  );

  send(
    req,
    contentOwner,
    salmonUrl,
    <Salmon
      req={req}
      activityObject={activityObject}
      id={content.url}
      action={'post'}
      content={content}
      title={content.title}
      atomContent={content.view}
      verb={'post'}
    />
  );
}

async function send(req, contentOwner, salmonUrl, tree) {
  if (!salmonUrl) {
    return;
  }

  let renderedTree = renderToString(tree);
  // XXX(mime): in the feeds I have some attributes that are `ref`. However, ref isn't allowed in React,
  // so in the DOM they are `refXXX`. Return them to normal here, sigh.
  renderedTree = renderedTree.replace(/refXXX="([^"]+)"/g, 'ref="$1"');

  const body = magic.sign({ data: renderedTree, data_type: 'application/atom+xml' }, contentOwner.private_key);
  try {
    await fetch(salmonUrl, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/magic-envelope+xml',
      },
    });
  } catch (ex) {
    // Not a big deal if this fails.
    // TODO(mime): add logging later.
  }
}

class Salmon extends PureComponent {
  render() {
    const { req, activityObject, atomContent, content, id, title, verb } = this.props;
    const namespaces = {
      xmlLang: 'en-US',
      xmlns: 'http://www.w3.org/2005/Atom',
      'xmlns:activity': 'http://activitystrea.ms/spec/1.0/',
      'xmlns:thr': 'http://purl.org/syndication/thread/1.0',
    };
    const tagDate = new Date().toISOString().slice(0, 10);

    return (
      <entry {...namespaces}>
        <title type="html">{title}</title>
        <id>{`tag:${req.get('host')},${tagDate}:${id || new Date().toISOString()}`}</id>
        <content type="html" dangerouslySetInnerHTML={{ __html: atomContent }} />
        <published>{new Date(content?.createdAt || new Date()).toISOString()}</published>
        <updated>{new Date(content?.updatedAt || new Date()).toISOString()}</updated>
        {RcE('activity:verb', {}, `http://activitystrea.ms/schema/1.0/${verb}`)}
        {activityObject}
      </entry>
    );
  }
}

export default (options) => async (req, res) => {
  // TODO(mime): make sure xsrf check here is disabled.
  if (!req.query.account) {
    return res.sendStatus(400);
  }
  const user = await options.getLocalUser(req.query.account);
  if (!user) {
    return res.sendStatus(404);
  }

  const magicJsonBody = magic.fromXML(req.body);
  const websiteUrl = magicJsonBody.author.uri;
  let userRemote = await options.getRemoteUser(user.username, websiteUrl);
  if (!userRemote) {
    const userRemoteInfo = await getUserRemoteInfo(websiteUrl, user.username);
    userRemote = await options.saveRemoteUser(userRemoteInfo);
  }

  const env = magic.verify(magicJsonBody, userRemote.magic_key);
  const $ = cheerio.load(env);
  const verb = $('activity:verb').text();

  switch (verb) {
    case 'http://activitystrea.ms/schema/1.0/follow':
      receiveFollow(options, req, user, userRemote, true);
      break;
    case 'http://ostatus.org/schema/1.0/unfollow':
    case 'http://activitystrea.ms/schema/1.0/stop-following':
      receiveFollow(options, req, user, userRemote, false);
      break;
    case 'http://activitystrea.ms/schema/1.0/favorite':
      receiveFavorite(options, res, $, websiteUrl, userRemote, true);
      break;
    case 'http://activitystrea.ms/schema/1.0/unfavorite':
    case 'http://ostatus.org/schema/1.0/unfavorite':
      receiveFavorite(options, res, $, websiteUrl, userRemote, false);
      break;
    case 'http://activitystrea.ms/schema/1.0/share':
      // Nothing here yet.
      break;
    case 'http://activitystrea.ms/schema/1.0/post':
      receivePostOrComment(options, req, res, $, user, userRemote, websiteUrl);
      break;
    default:
      break;
  }

  res.sendStatus(204);
};

async function receiveFollow(options, req, user, userRemote, isFollow) {
  if (isFollow) {
    await options.saveRemoteUser(Object.assign({}, userRemote, { follower: true }));
    emailFollow(req, user.username, user.email, userRemote.profile_url);
  } else {
    if (userRemote.following) {
      await options.saveRemoteUser(Object.assign({}, userRemote, { follower: false }));
    } else {
      await options.removeRemoteUser(userRemote);
    }
  }
}

async function receiveFavorite(options, res, $, websiteUrl, userRemote, isFavorite) {
  const atomId = $('activity:object atom:id').text();
  const localContentUrl = atomId.split(':')[2];
  const { username, name } = await options.getLocalContent(localContentUrl);

  // XXX(mime): this is all wrong. Need to get a proper postId for this favorite.
  const postId = 'XXXfavoritePost';
  const remoteContent = {
    from_user: websiteUrl,
    local_content_name: name,
    to_username: username,
    type: 'favorite',
    name,
  };

  if (!isFavorite) {
    await options.removeOldRemoteContent(remoteContent);
    return;
  }

  const existingFavorite = await options.getRemoteContent(username, postId);
  if (existingFavorite) {
    return;
  }

  if (!content) {
    return res.sendStatus(400);
  }

  await options.saveRemoteContent({
    content: '',
    createdAt: new Date($('atom:updated').text() || new Date()),
    from_user: websiteUrl,
    link: '',
    local_content_name: content.name,
    post_id: '',
    title: '',
    to_username: username,
    type: 'favorite',
    username: userRemote.username,
    view: '',
  });
}

async function receivePostOrComment(options, req, res, $, user, userRemote, websiteUrl) {
  const atomContent = sanitizeHTML($('atom:content').text());

  // XXX(mime): this is all wrong. Need to get a proper postId for this favorite.
  const postId = 'XXXpost';
  const existingContentRemote = await options.getRemoteContent(user.username, postId)

  const contentRemote = {
    id: existingContentRemote?.id || undefined,
    avatar: userRemote.avatar,
    comments_count: parseInt($('thr:replies').attr('count')),
    comments_updated: new Date($('thr:replies').attr('updated') || new Date()),
    content: '',
    createdAt: new Date($('atom:published').text() || new Date()),
    from_user: websiteUrl,
    link: $('atom:link[rel="alternate"]').attr('href'),
    post_id: $('atom:id').text(),
    title: $('atom:title').text(),
    to_username: user.username,
    updatedAt: new Date($('atom:updated').text() || new Date()),
    username: userRemote.username,
    view: atomContent,
  };

  const thread = $('thr:in-reply-to');
  if (thread) {
    handlePost(options, req, res, contentRemote, user, $);
  } else {
    handleComment(options, req, res, contentRemote, thread);
  }

  //const replies = $('thr:replies');
  // if (replies) {
  //   // TODO(mime): these used to be known as 'remote-comment' types.
  //   // need to refactor this.
  //   const comments = await retrieveFeed(replies.attr('href'));
  //   await parseFeedAndInsertIntoDb(salmon, userRemote, comments);
  // }
}

async function handlePost(options, req, res, contentRemote, user, $) {
  const wasUserMentioned =
    $('atom:link[rel="mentioned"]').find(e => e.attr('href') === user.url) ||
    $('atom:link[rel="ostatus:attention"]').find(e => e.attr('href') === user.url);

  contentRemote.type = 'post';
  await options.saveRemoteContent(contentRemote);

  if (wasUserMentioned) {
    emailMention(
      req,
      'Remote User',
      contentRemote.link /* XXX(mime): can't be right */,
      user.email,
      contentRemote.link
    );
  }
}

async function handleComment(options, req, res, contentRemote, thread) {
  const localContentUrl = thread.attr('ref').split(':')[2];
  const content = await options.getLocalContent(localContentUrl);
  if (!content) {
    return res.sendStatus(400);
  }

  contentRemote.type = 'comment';
  contentRemote.local_content_name = name;
  await options.saveRemoteContent(contentRemote);

  const contentOwner = await options.getLocalUser(localContentUrl);
  await syndicate(req, contentOwner, content, contentRemote, true /* isComment */);
}
