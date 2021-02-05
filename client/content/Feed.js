import { F } from 'react-intl-wrapper';
import gql from 'graphql-tag';
import InfiniteFeed from '../components/InfiniteFeed';
import Item from './Item';
import React from 'react';
import { useQuery } from '@apollo/react-hooks';

const FETCH_COLLECTION_PAGINATED = gql`
  query($username: String!, $section: String!, $name: String!, $offset: Int!) {
    fetchCollectionPaginated(username: $username, section: $section, name: $name, offset: $offset) {
      album
      code
      comments_count
      comments_updated
      count
      count_robot
      createdAt
      updatedAt
      hidden
      name
      order
      redirect
      section
      sort_type
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

export default function Feed({ content: { username, section, name }, didFeedLoad }) {
  const { loading, data, fetchMore } = useQuery(FETCH_COLLECTION_PAGINATED, {
    variables: {
      username,
      section,
      name,
      offset: 0,
    },
    fetchPolicy: didFeedLoad ? 'network-only' : 'cache-first',
  });

  if (loading) {
    return null;
  }

  const collection = data.fetchCollectionPaginated;
  const contentOwner = data.fetchPublicUserData;

  if (!collection.length) {
    return <F msg="Nothing to read right now!" />;
  }

  return (
    <InfiniteFeed fetchMore={fetchMore} queryName="fetchCollectionPaginated">
      {collection.map(item => (
        <Item key={item.name} content={item} contentOwner={contentOwner} isFeed={true} />
      ))}
    </InfiniteFeed>
  );
}
