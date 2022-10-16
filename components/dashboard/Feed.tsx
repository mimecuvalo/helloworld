import { DocumentNode, gql, useQuery } from '@apollo/client';
import { FetchContentRemotePaginatedQuery, Post, UserRemotePrivate } from 'data/graphql-generated';
import { InfiniteFeed, styled } from 'components';

import { F } from 'i18n';
import Item from './Item';

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
  query FetchContentRemotePaginated(
    $profileUrlOrSpecialFeed: String!
    $offset: Int!
    $query: String
    $shouldShowAllItems: Boolean
  ) {
    fetchContentRemotePaginated(
      profileUrlOrSpecialFeed: $profileUrlOrSpecialFeed
      offset: $offset
      query: $query
      shouldShowAllItems: $shouldShowAllItems
    ) {
      avatar
      commentsCount
      creator
      createdAt
      deleted
      favorited
      fromUsername
      isSpam
      link
      localContentName
      postId
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
  userRemote,
  specialFeed,
  query,
  shouldShowAllItems,
  didFeedLoad,
}: {
  userRemote: UserRemotePrivate;
  specialFeed: string;
  query: DocumentNode;
  shouldShowAllItems: boolean;
  didFeedLoad: boolean;
}) {
  const { loading, data, fetchMore } = useQuery<FetchContentRemotePaginatedQuery>(FETCH_CONTENT_REMOTE_PAGINATED, {
    variables: {
      profileUrlOrSpecialFeed: userRemote ? userRemote.profileUrl : specialFeed,
      offset: 0,
      query,
      shouldShowAllItems,
    },
    fetchPolicy: didFeedLoad ? 'network-only' : 'cache-first',
  });

  function dedupe(currentFeed: any, nextResults: any) {
    return nextResults.filter((nextEl: Post) => !currentFeed.find((prevEl: Post) => prevEl.postId === nextEl.postId));
  }

  if (loading || !data) {
    return null;
  }

  const feed = data.fetchContentRemotePaginated;

  return (
    <InfiniteFeed deduper={dedupe} fetchMore={fetchMore} queryName="fetchContentRemotePaginated">
      {userRemote || query ? (
        <Header>
          {userRemote ? (
            <a href={userRemote.profileUrl} target="_blank" rel="noopener noreferrer">
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
        feed.map((item) => <Item key={item.postId} contentRemote={item as Post} />)
      )}
    </InfiniteFeed>
  );
}
