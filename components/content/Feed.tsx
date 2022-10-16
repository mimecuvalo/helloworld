import { Content, FetchCollectionQuery, UserPublic } from 'data/graphql-generated';
import { gql, useQuery } from '@apollo/client';

import { F } from 'i18n';
import InfiniteFeed from 'components/InfiniteFeed';
import Item from './Item';
import { styled } from 'components';

export const ItemWrapper = styled('div')`
  clear: both;
  zoom: 0.75;
  margin-right: 32px;
  flex: 0 1;
  max-height: 90vh;
  min-width: 34vw;
  overflow-y: scroll;
  padding-bottom: 0;
  margin-bottom: 32px;
  box-shadow: 0 0 0 1px #09f;
  transition: box-shadow 100ms;

  & .hw-view {
    margin: 6px 10px;
  }

  & p {
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
  }

  & ul,
  & ol,
  & blockquote {
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    padding-inline-start: 20px;
  }

  & blockquote {
    border-left: 1px solid #666;
  }

  & a {
    word-wrap: break-word;
  }

  & pre {
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  & img {
    max-width: 100%;
    height: auto;
  }

  & iframe {
    border: 0;
    max-width: 100%;
  }
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
      description
      favicon
      logo
      name
      title
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
    <InfiniteFeed fetchMore={fetchMore} queryName="fetchCollectionPaginated">
      {collection.map((item) => (
        <ItemWrapper key={item.name}>
          <Item content={item as Content} contentOwner={contentOwner as UserPublic} isFeed={true} />
        </ItemWrapper>
      ))}
    </InfiniteFeed>
  );
}
