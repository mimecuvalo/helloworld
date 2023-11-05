import { ContentRemote, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getLocalUser, getRemoteCommentsOnLocalContent } from 'social-butterfly/db';

import { GenericFeed } from './feed';
import { createElement as RcE } from 'react';
import { renderToString } from 'react-dom/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const contentOwner = await getLocalUser(req.query.resource as string);
  if (!contentOwner) {
    return res.status(404).end();
  }
  const comments = await getRemoteCommentsOnLocalContent(req.query.resource as string);

  let renderedTree =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    renderToString(<Comments contentOwner={contentOwner} comments={comments} req={req} />);
  // XXX(mime): in the feeds I have some attributes that are `ref`. However, ref isn't allowed in React,
  // so in the DOM they are `refXXX`. Return them to normal here, sigh.
  renderedTree = renderedTree.replace(/refXXX="([^"]+)"/g, 'ref="$1"');

  res.setHeader('Content-Type', 'application/xml');
  res.send(renderedTree);
}

function Comments({
  req,
  comments,
  contentOwner,
}: {
  req: NextApiRequest;
  comments: ContentRemote[];
  contentOwner: User;
}) {
  return (
    <GenericFeed contentOwner={contentOwner} req={req}>
      {comments.map((comment) => (
        <Comment key={comment.postId} comment={comment} req={req} />
      ))}
    </GenericFeed>
  );
}

function Comment({ comment, req }: { req: NextApiRequest; comment: ContentRemote }) {
  const html = '<![CDATA[' + comment.view + ']]>';
  const tagDate = new Date().toISOString().slice(0, 10);
  const threadUrl = `tag:${req.headers['host']},${tagDate}:${req.query.resource}`;

  return (
    <entry>
      <link href={comment.link} />
      <id>{comment.postId}</id>
      <author>
        <name>{comment.username}</name>
        {comment.fromUsername ? <uri>{comment.fromUsername}</uri> : null}
        {RcE('poco:photos', {}, [
          RcE('poco:value', { key: 'value' }, comment.avatar),
          RcE('poco:type', { key: 'type' }, 'thumbnail'),
        ])}
      </author>

      <content type="html" dangerouslySetInnerHTML={{ __html: html }} />
      <published>{new Date(comment.createdAt || '').toISOString().slice(0, 10)}</published>
      {RcE('activity:verb', {}, `http://activitystrea.ms/schema/1.0/post`)}
      {RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/comment`)}

      {/* see endpoint_with_apollo for refXXX transform */}
      {RcE('thr:in-reply-to', { refXXX: threadUrl })}
    </entry>
  );
}
