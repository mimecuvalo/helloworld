import { F } from '../../shared/i18n';
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
      fetchPolicy: 'network-only',
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
        {userRemote ? (
          <h1 className={styles.header}>
            <a href={userRemote.profile_url} target="_blank" rel="noopener noreferrer">
              {userRemote.username}
            </a>
          </h1>
        ) : null}
        {!feed.length ? (
          <F msg="Nothing to read right now!" />
        ) : (
          feed.map(item => <Item key={item.post_id} contentRemote={item} />)
        )}
      </>
    );
  }
}

export default Feed;
