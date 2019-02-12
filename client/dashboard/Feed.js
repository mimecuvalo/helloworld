import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import Item from './Item';
import React, { PureComponent } from 'react';

@graphql(
  gql`
    query($currentFeed: String) {
      fetchContentRemotePaginated(currentFeed: $currentFeed) {
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
        updatedAt
        username
        view
      }
    }
  `,
  {
    options: ({ currentFeed }) => ({
      variables: {
        currentFeed,
      },
    }),
  }
)
class Feed extends PureComponent {
  render() {
    if (this.props.data.loading) {
      return null;
    }

    const feed = this.props.data.fetchContentRemotePaginated;

    return (
      <article className={this.props.className}>
        {feed.map(item => (
          <Item key={item.post_id} contentRemote={item} />
        ))}
      </article>
    );
  }
}

export default Feed;
