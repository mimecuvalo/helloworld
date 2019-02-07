import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import Item from '../content/Item';
import React, { PureComponent } from 'react';

@graphql(gql`
  {
    fetchContentRemotePaginated {
      avatar
      comments_count
      creator
      createdAt
      deleted
      favorited
      from_user
      is_spam
      link
      post_id
      read
      title
      type
      username
      view
    }
  }
`)
class Feed extends PureComponent {
  render() {
    if (this.props.data.loading) {
      return null;
    }

    const feed = this.props.data.fetchContentRemotePaginated;

    return (
      <article className={this.props.className}>
        {feed.map(item => (
          <Item key={item.link} content={item} />
        ))}
      </article>
    );
  }
}

export default Feed;
