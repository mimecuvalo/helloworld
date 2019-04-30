import endpointWithApollo from '../../util/endpoint_with_apollo';
import { GenericFeed } from './feed';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { parseContentUrl } from '../../../shared/util/url_factory';
import React, { createElement as RcE, PureComponent } from 'react';

export default async (req, res, next) => {
  const type = 'xml';
  const preamble = `<?xml version="1.0" encoding="UTF-8"?>`;
  const { username, name } = parseContentUrl(req.query.url);
  return await endpointWithApollo(
    req,
    res,
    next,
    type,
    preamble,
    <Comments username={username} name={name} req={req} />
  );
};

@graphql(
  gql`
    query CommentsAndUserQuery($username: String!, $name: String!) {
      fetchCommentsRemote(username: $username, name: $name) {
        avatar
        createdAt
        from_user
        link
        post_id
        username
        view
      }

      fetchPublicUserData(username: $username) {
        description
        email
        favicon
        license
        logo
        name
        title
        username
      }
    }
  `,
  {
    options: ({ username, name }) => ({
      variables: {
        username,
        name,
      },
    }),
  }
)
class Comments extends PureComponent {
  render() {
    const comments = this.props.data.fetchCommentsRemote;
    const contentOwner = this.props.data.fetchPublicUserData;
    const req = this.props.req;

    return (
      <GenericFeed contentOwner={contentOwner} req={req}>
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
