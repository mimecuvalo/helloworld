import { F } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import InfiniteFeed from '../components/InfiniteFeed';
import Item from './Item';
import React, { PureComponent } from 'react';
import styles from './Dashboard.module.css';

@graphql(
  gql`
    query($profileUrlOrSpecialFeed: String!, $offset: Int!, $query: String, $shouldShowAllItems: Boolean) {
      fetchContentRemotePaginated(
        profileUrlOrSpecialFeed: $profileUrlOrSpecialFeed
        offset: $offset
        query: $query
        shouldShowAllItems: $shouldShowAllItems
      ) {
        avatar
        comments_count
        creator
        createdAt
        deleted
        favorited
        from_user
        is_spam
        link
        local_content_name
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
    options: ({ userRemote, specialFeed, query, shouldShowAllItems, didFeedLoad }) => ({
      variables: {
        profileUrlOrSpecialFeed: userRemote ? userRemote.profile_url : specialFeed,
        offset: 0,
        query,
        shouldShowAllItems,

        // XXX(mime): see https://github.com/apollographql/react-apollo/issues/556
        antiCache: didFeedLoad && typeof window !== 'undefined' ? +new Date() : undefined,
      },
      fetchPolicy: didFeedLoad ? 'network-only' : 'cache-first',
    }),
  }
)
class Feed extends PureComponent {
  dedupe(currentFeed, nextResults) {
    return nextResults.filter(nextEl => !currentFeed.find(prevEl => prevEl.post_id === nextEl.post_id));
  }

  render() {
    if (this.props.data.loading) {
      return null;
    }

    const feed = this.props.data.fetchContentRemotePaginated;
    const { userRemote, query } = this.props;

    return (
      <InfiniteFeed deduper={this.dedupe} fetchMore={this.props.data.fetchMore} queryName="fetchContentRemotePaginated">
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
          feed.map(item => <Item key={item.post_id} contentRemote={item} getEditor={this.props.getEditor} />)
        )}
      </InfiniteFeed>
    );
  }
}

export default Feed;
