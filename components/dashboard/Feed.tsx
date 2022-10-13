import { DocumentNode, gql, useQuery } from '@apollo/client';
import { InfiniteFeed, styled } from 'components';

import { F } from 'i18n';
import Item from './Item';
import { ReactNode } from 'react';

const Header = styled('h1')`
  border: 1px solid #0cf;
  box-shadow: 1px 1px #0cf, 2px 2px #0cf, 3px 3px #0cf;
  width: 80%;
  margin-bottom: 25px;
  padding: 3px 6px;
`;

const Empty = styled('div')`
  width: 100%;
`;

const FETCH_CONTENT_REMOTE_PAGINATED = gql`
  query ($profileUrlOrSpecialFeed: String!, $offset: Int!, $query: String, $shouldShowAllItems: Boolean) {
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

// TODO(mime): type better
export default function Feed({
  getEditor,
  userRemote,
  specialFeed,
  query,
  shouldShowAllItems,
  didFeedLoad,
}: {
  getEditor: ReactNode;
  userRemote: User;
  specialFeed: string;
  query: DocumentNode;
  shouldShowAllItems: boolean;
  didFeedLoad: boolean;
}) {
  const { loading, data, fetchMore } = useQuery(FETCH_CONTENT_REMOTE_PAGINATED, {
    variables: {
      profileUrlOrSpecialFeed: userRemote ? userRemote.profile_url : specialFeed,
      offset: 0,
      query,
      shouldShowAllItems,
    },
    fetchPolicy: didFeedLoad ? 'network-only' : 'cache-first',
  });

  function dedupe(currentFeed: any, nextResults: any) {
    return nextResults.filter((nextEl) => !currentFeed.find((prevEl) => prevEl.post_id === nextEl.post_id));
  }

  if (loading) {
    return null;
  }

  const feed = data.fetchContentRemotePaginated;

  return (
    <InfiniteFeed deduper={dedupe} fetchMore={fetchMore} queryName="fetchContentRemotePaginated">
      {userRemote || query ? (
        <Header>
          {userRemote ? (
            <a href={userRemote.profile_url} target="_blank" rel="noopener noreferrer">
              {userRemote.username}
            </a>
          ) : (
            <>
              <F defaultMessage="Search:" /> {query}
            </>
          )}
        </Header>
      ) : null}
      {!feed.length ? (
        <Empty>
          <F defaultMessage="Nothing to read right now!" />
        </Empty>
      ) : (
        feed.map((item) => <Item key={item.post_id} contentRemote={item} getEditor={getEditor} />)
      )}
    </InfiniteFeed>
  );
}
