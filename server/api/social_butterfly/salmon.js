import { buildUrl, contentUrl, parseContentUrl, profileUrl } from '../../../shared/util/url_factory';
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import { follow as emailFollow } from './email';
import { getUserRemoteInfo } from './discover_user';
import magic from 'magic-signatures';
import { mention as emailMention } from './email';
import models from '../../data/models';
import { parseUsernameFromAccount } from './discover_user';
import React, { createElement as RcE, PureComponent } from 'react';
import { renderToString } from 'react-dom/server';
import { sanitizeHTML } from '../../util/crawler';
import socialize from './socialize';

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
  const contentUrlWithHost = contentUrl(content, req);
  const contentUrlWithoutHost = contentUrl(content);
  const objectType = content.section === 'comments' ? 'comment' : 'note';
  const repliesUrl = buildUrl({ pathname: '/api/social/comments', searchParams: { url: contentUrlWithoutHost } });
  const activityObject = (
    <>
      {RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/${objectType}`)}
      <link href={contentUrlWithHost} rel="alternate" type="text/html" />
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
      id={contentUrlWithHost}
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

export default async (req, res) => {
  // TODO(mime): make sure xsrf check here is disabled.
  if (!req.query.q) {
    return res.sendStatus(400);
  }
  const username = parseUsernameFromAccount(req.query.q);
  const user = await models.User.findOne({ where: { username } });
  if (!user) {
    return res.sendStatus(404);
  }

  const magicJsonBody = magic.fromXML(req.body);
  const websiteUrl = magicJsonBody.author.uri;
  let userRemote = await models.User.findOne({ where: { local_username: user.username, profile_url: websiteUrl } });
  if (!userRemote) {
    const userRemoteInfo = await getUserRemoteInfo(websiteUrl, user.username);
    userRemote = await models.User_Remote.create(userRemoteInfo, { validate: true });
  }

  const env = magic.verify(magicJsonBody, userRemote.magic_key);
  const $ = cheerio.load(env);
  const verb = $('activity:verb').text();

  switch (verb) {
    case 'http://activitystrea.ms/schema/1.0/follow':
      receiveFollow(req, user, userRemote, true);
      break;
    case 'http://ostatus.org/schema/1.0/unfollow':
    case 'http://activitystrea.ms/schema/1.0/stop-following':
      receiveFollow(req, user, userRemote, false);
      break;
    case 'http://activitystrea.ms/schema/1.0/favorite':
      receiveFavorite(res, $, websiteUrl, userRemote, true);
      break;
    case 'http://activitystrea.ms/schema/1.0/unfavorite':
    case 'http://ostatus.org/schema/1.0/unfavorite':
      receiveFavorite(res, $, websiteUrl, userRemote, false);
      break;
    case 'http://activitystrea.ms/schema/1.0/share':
      // Nothing here yet.
      break;
    case 'http://activitystrea.ms/schema/1.0/post':
      receivePostOrComment(req, res, $, user, userRemote, websiteUrl);
      break;
    default:
      break;
  }

  res.sendStatus(204);
};

async function receiveFollow(req, user, userRemote, isFollow) {
  if (isFollow) {
    await models.User_Remote.update({ follower: true }, { id: userRemote.id });
    emailFollow(req, user.username, user.email, userRemote.profile_url);
  } else {
    if (userRemote.following) {
      await models.User_Remote.update({ follower: false }, { id: userRemote.id });
    } else {
      await models.User_Remote.destroy({ where: { id: userRemote.id } });
    }
  }
}

async function receiveFavorite(res, $, websiteUrl, userRemote, isFavorite) {
  const atomId = $('activity:object atom:id').text();
  const localContentUrl = atomId.split(':')[2];
  const { username, name } = parseContentUrl(localContentUrl);

  const contentRemoteWhere = {
    from_user: websiteUrl,
    local_content_name: name,
    to_username: username,
    type: 'favorite',
    name,
  };

  if (!isFavorite) {
    await models.Content_Remote.destroy({ where: contentRemoteWhere });
    return;
  }

  const existingFavorite = await models.Content_Remote.findOne({ where: contentRemoteWhere });
  if (existingFavorite) {
    return;
  }

  const content = await models.Content.findOne({ where: { username, name } });
  if (!content) {
    return res.sendStatus(400);
  }
  await models.Content.update({ favorites_count: content.favorites_count + 1 }, { where: { id: content.id } });

  await models.Content_Remote.create({
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

async function receivePostOrComment(req, res, $, user, userRemote, websiteUrl) {
  const atomContent = sanitizeHTML($('atom:content').text());
  const existingContentRemote = await models.Content_Remote.findOne({
    where: {
      to_username: user.username,
      from_user: websiteUrl,
      view: atomContent, // XXX(mime): gotta be a better way, old code.
    },
  });

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
    handlePost(req, res, contentRemote, user, $);
  } else {
    handleComment(req, res, contentRemote, thread);
  }

  //const replies = $('thr:replies');
  // if (replies) {
  //   // TODO(mime): these used to be known as 'remote-comment' types.
  //   // need to refactor this.
  //   const comments = await retrieveFeed(replies.attr('href'));
  //   await parseFeedAndInsertIntoDb(userRemote, comments);
  // }
}

async function handlePost(req, res, contentRemote, user, $) {
  const profile = profileUrl(user.username, req);
  const wasUserMentioned =
    $('atom:link[rel="mentioned"]').find(e => e.attr('href') === profile) ||
    $('atom:link[rel="ostatus:attention"]').find(e => e.attr('href') === profile);

  contentRemote.type = 'post';
  await models.Content_Remote.upsert(contentRemote);

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

async function handleComment(req, res, contentRemote, thread) {
  const localContentUrl = thread.attr('ref').split(':')[2];
  const { username, name } = parseContentUrl(localContentUrl);
  const content = await models.Content.findOne({ where: { username, name } });
  if (!content) {
    return res.sendStatus(400);
  }

  contentRemote.type = 'comment';
  contentRemote.local_content_name = name;
  await models.Content_Remote.upsert(contentRemote);

  await models.Content.update(
    { comments_count: content.comments_count + 1, comments_updated: new Date() },
    { where: { id: content.id } }
  );
  const updatedCommentedContent = await models.Content.findOne({ where: { id: content.id } });

  const contentOwner = await models.User.findOne({ where: { username } });
  await socialize(req, contentOwner, updatedCommentedContent, contentRemote, true /* isComment */);
}
