import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import Item from './Item';
import React, { PureComponent } from 'react';
import styles from './Dashboard.module.css';

@graphql(
  gql`
    query($profileUrlOrSpecialFeed: String) {
      fetchContentRemotePaginated(profileUrlOrSpecialFeed: $profileUrlOrSpecialFeed) {
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
    options: ({ userRemote, specialFeed }) => ({
      variables: {
        profileUrlOrSpecialFeed: userRemote ? userRemote.profile_url : specialFeed,
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
    const { userRemote } = this.props;

    return (
      <>
        {userRemote ? <h1 className={styles.header}>{userRemote.username}</h1> : null}
        {feed.map(item => (
          <Item key={item.post_id} contentRemote={item} />
        ))}
      </>
    );
  }
}

export default Feed;
