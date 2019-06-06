import { GenericFeed } from './feed';
import React, { createElement as RcE, PureComponent } from 'react';
import { renderToString } from 'react-dom/server';

export default (options) => async (req, res, next) => {
  const contentOwner = await options.getLocalUser(req.query.url, req);
  if (!contentOwner) {
    return res.sendStatus(404);
  }
  const comments = await options.getRemoteCommentsOnLocalContent(req.query.url);

  let renderedTree = `<?xml version='1.0' encoding='UTF-8'?>` +
    renderToString(<Comments contentOwner={contentOwner} comments={comments} req={req} constants={options.constants} />);
  // XXX(mime): in the feeds I have some attributes that are `ref`. However, ref isn't allowed in React,
  // so in the DOM they are `refXXX`. Return them to normal here, sigh.
  renderedTree = renderedTree.replace(/refXXX="([^"]+)"/g, 'ref="$1"');

  res.type('xml');
  res.send(renderedTree);
};

class Comments extends PureComponent {
  render() {
    const { constants, req, comments, contentOwner } = this.props;

    return (
      <GenericFeed contentOwner={contentOwner} constants={constants} req={req}>
        {comments.map(comment => (
          <Comment key={comment.post_id} comment={comment} req={req} />
        ))}
      </GenericFeed>
    );
  }
}

class Comment extends PureComponent {
  render() {
    const { comment, req } = this.props;
    const html = '<![CDATA[' + comment.view + ']]>';
    const tagDate = new Date().toISOString().slice(0, 10);
    const threadUrl = `tag:${req.get('host')},${tagDate}:${req.query.url}`;

    return (
      <entry>
        <link href={comment.link} />
        <id>{comment.post_id}</id>
        <author>
          <name>{comment.username}</name>
          {comment.from_user ? <uri>{comment.from_user}</uri> : null}
          {RcE('poco:photos', {}, [
            RcE('poco:value', { key: 'value' }, comment.avatar),
            RcE('poco:type', { key: 'type' }, 'thumbnail'),
          ])}
        </author>

        <content type="html" dangerouslySetInnerHTML={{ __html: html }} />
        <published>{new Date(comment.createdAt).toISOString().slice(0, 10)}</published>
        {RcE('activity:verb', {}, `http://activitystrea.ms/schema/1.0/post`)}
        {RcE('activity:object-type', {}, `http://activitystrea.ms/schema/1.0/comment`)}

        {/* see endpoint_with_apollo for refXXX transform */}
        {RcE('thr:in-reply-to', { refXXX: threadUrl })}
      </entry>
    );
  }
}
