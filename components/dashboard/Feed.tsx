import { FeedWrapper, InfiniteFeed, ItemWrapper, Link, Typography, styled } from 'components';
import { FetchContentRemotePaginatedQuery, Post, UserRemotePublic } from 'data/graphql-generated';
import { gql, useQuery } from '@apollo/client';

import { F } from 'i18n';
import Item from './Item';
import baseTheme from 'styles';

const Header = styled(Typography)`
  position: sticky;
  top: ${(props) => props.theme.spacing(1)};
  z-index: ${baseTheme.zindex.abovePage};
  background: ${(props) => props.theme.palette.background.default};
  border: 1px solid ${(props) => props.theme.palette.primary.light};
  box-shadow:
    1px 1px ${(props) => props.theme.palette.primary.light},
    2px 2px ${(props) => props.theme.palette.primary.light},
    3px 3px ${(props) => props.theme.palette.primary.light};
  width: 100%;
  margin-bottom: ${(props) => props.theme.spacing(3)};
  padding: ${(props) => props.theme.spacing(0.5, 1)};
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

export default function Feed({
  userRemote,
  specialFeed,
  query,
  shouldShowAllItems,
  didFeedLoad,
}: {
  userRemote: UserRemotePublic | null;
  specialFeed: string;
  query: string;
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
    fetchPolicy: didFeedLoad ? 'cache-first' : 'network-only',
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
        <Header variant="h1">
          {userRemote ? (
            <Link href={userRemote.profileUrl} target="_blank" className="notranslate">
              {userRemote.username}
            </Link>
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
        feed.map((item) => (
          <FeedWrapper key={item.postId}>
            <ItemWrapper className="hw-item">
              <Item contentRemote={item as Post} userRemote={userRemote as UserRemotePublic} />
            </ItemWrapper>
          </FeedWrapper>
        ))
      )}
    </InfiniteFeed>
  );
}
