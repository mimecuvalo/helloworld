import { F } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import InfiniteFeed from '../components/InfiniteFeed';
import Item from './Item';
import React, { PureComponent } from 'react';
import styles from './Dashboard.module.css';

@graphql(
  gql`
    query($profileUrlOrSpecialFeed: String!, $offset: Int!, $query: String) {
      fetchContentRemotePaginated(profileUrlOrSpecialFeed: $profileUrlOrSpecialFeed, offset: $offset, query: $query) {
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
    options: ({ userRemote, specialFeed, query }) => ({
      variables: {
        profileUrlOrSpecialFeed: userRemote ? userRemote.profile_url : specialFeed,
        offset: 0,
        query,
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
    const { userRemote, query } = this.props;

    return (
      <InfiniteFeed fetchMore={this.props.data.fetchMore} queryName="fetchContentRemotePaginated">
        {userRemote || query ? (
          <h1 className={styles.header}>
            {userRemote ? (
              <a href={userRemote.profile_url} target="_blank" rel="noopener noreferrer">
                {userRemote.username}
              </a>
            ) : (
              <>
                <F msg="Search:" /> {query}
              </>
            )}
          </h1>
        ) : null}
        {!feed.length ? (
          <div className={styles.empty}>
            <F msg="Nothing to read right now!" />
          </div>
        ) : (
          feed.map(item => <Item key={item.post_id} contentRemote={item} />)
        )}
      </InfiniteFeed>
    );
  }
}

export default Feed;
