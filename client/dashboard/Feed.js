import { createUseStyles } from 'react-jss';
import { F } from 'react-intl-wrapper';
import gql from 'graphql-tag';
import InfiniteFeed from '../components/InfiniteFeed';
import Item from './Item';
import { useQuery } from '@apollo/client';

const useStyles = createUseStyles({
  header: {
    border: '1px solid #0cf',
    boxShadow: '1px 1px #0cf, 2px 2px #0cf, 3px 3px #0cf',
    width: '80%',
    marginBottom: '25px',
    padding: '3px 6px',
  },
  empty: {
    width: '100%',
  },
});

const FETCH_CONTENT_REMOTE_PAGINATED = gql`
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
`;

export default function Feed({ getEditor, userRemote, specialFeed, query, shouldShowAllItems, didFeedLoad }) {
  const { loading, data, fetchMore } = useQuery(FETCH_CONTENT_REMOTE_PAGINATED, {
    variables: {
      profileUrlOrSpecialFeed: userRemote ? userRemote.profile_url : specialFeed,
      offset: 0,
      query,
      shouldShowAllItems,
    },
    fetchPolicy: didFeedLoad ? 'network-only' : 'cache-first',
  });
  const styles = useStyles();

  function dedupe(currentFeed, nextResults) {
    return nextResults.filter((nextEl) => !currentFeed.find((prevEl) => prevEl.post_id === nextEl.post_id));
  }

  if (loading) {
    return null;
  }

  const feed = data.fetchContentRemotePaginated;

  return (
    <InfiniteFeed deduper={dedupe} fetchMore={fetchMore} queryName="fetchContentRemotePaginated">
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
        feed.map((item) => <Item key={item.post_id} contentRemote={item} getEditor={getEditor} />)
      )}
    </InfiniteFeed>
  );
}
