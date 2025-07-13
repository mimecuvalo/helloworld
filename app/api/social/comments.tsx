import { ContentRemote, User } from '@prisma/client';
import { getLocalUser, getRemoteCommentsOnLocalContent } from 'social-butterfly/db';
import { NextRequest, NextResponse } from 'next/server';

import { GenericFeed } from './feed';
import { createElement as RcE } from 'react';
import { renderToString } from 'react-dom/server';

export default async function comments(req: NextRequest) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const contentOwner = await getLocalUser(req.nextUrl.searchParams.get('resource') as string);
  if (!contentOwner) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const comments = await getRemoteCommentsOnLocalContent(req.nextUrl.searchParams.get('resource') as string);

  let renderedTree =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    renderToString(<Comments contentOwner={contentOwner} comments={comments} req={req} />);
  // XXX(mime): in the feeds I have some attributes that are `ref`. However, ref isn't allowed in React,
  // so in the DOM they are `refXXX`. Return them to normal here, sigh.
  renderedTree = renderedTree.replace(/refXXX="([^"]+)"/g, 'ref="$1"');

  return NextResponse.json(renderedTree, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

function Comments({
  req,
  comments,
  contentOwner,
}: {
  req: NextRequest;
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

function Comment({ comment, req }: { req: NextRequest; comment: ContentRemote }) {
  const html = '<![CDATA[' + comment.view + ']]>';
  const tagDate = new Date().toISOString().slice(0, 10);
  const threadUrl = `tag:${req.headers.get('host')},${tagDate}:${req.nextUrl.searchParams.get('resource')}`;

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
