import { Content, FetchCollectionQuery, UserPublic } from 'data/graphql-generated';
import { FeedWrapper, InfiniteFeed, styled } from 'components';
import { gql, useQuery } from '@apollo/client';

import { F } from 'i18n';
import Item from './Item';

const FeedContainer = styled('div', { label: 'FeedContainer' })`
  display: flex;
  flex-direction: row;
  flex-flow: wrap;
  justify-content: space-between;
`;

const FETCH_COLLECTION_PAGINATED = gql`
  query FetchCollection($username: String!, $section: String!, $name: String!, $offset: Int!) {
    fetchCollectionPaginated(username: $username, section: $section, name: $name, offset: $offset) {
      album
      code
      commentsCount
      commentsUpdated
      count
      countRobot
      createdAt
      updatedAt
      hidden
      name
      order
      redirect
      section
      sortType
      style
      template
      thumb
      title
      username
      view
      content
    }

    fetchPublicUserData(username: $username) {
      username
      description
      favicon
      logo
      name
      title
      theme
      viewport
    }
  }
`;

export default function Feed({
  content: { username, section, name },
  didFeedLoad,
}: {
  content: Pick<Content, 'username' | 'section' | 'name'>;
  didFeedLoad?: boolean;
}) {
  const { loading, data, fetchMore } = useQuery<FetchCollectionQuery>(FETCH_COLLECTION_PAGINATED, {
    variables: {
      username,
      section,
      name,
      offset: 0,
    },
    fetchPolicy: didFeedLoad ? 'network-only' : 'cache-first',
  });

  if (loading || !data) {
    return null;
  }

  const collection = data.fetchCollectionPaginated;
  const contentOwner = data.fetchPublicUserData;

  if (!collection.length) {
    return <F defaultMessage="Nothing to read right now!" />;
  }

  return (
    <FeedContainer>
      <InfiniteFeed fetchMore={fetchMore} queryName="fetchCollectionPaginated">
        {collection.map((item) => (
          <FeedWrapper key={item.name}>
            <Item content={item as Content} contentOwner={contentOwner as UserPublic} isFeed={true} />
          </FeedWrapper>
        ))}
      </InfiniteFeed>
    </FeedContainer>
  );
}
