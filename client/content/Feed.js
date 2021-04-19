import { useEffect, useState } from 'react';

import { F } from 'shared/util/i18n';
import InfiniteFeed from 'client/components/InfiniteFeed';
import Item from './Item';
import { createUseStyles } from 'react-jss';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';
import useWindowSize from 'client/components/windowSize';

const useStyles = createUseStyles({
  /* Reset some sane defaults for web content. Taken from Chrome's User Agent defaults. */
  item: {
    clear: 'both',
    zoom: '0.75',
    marginRight: '32px',
    flex: '0 1',
    maxHeight: '90vh',
    minWidth: '34vw',
    overflowY: 'scroll',
    paddingBottom: '0',
    marginBottom: '32px',
    boxShadow: '0 0 0 1px #09f',
    transition: 'box-shadow 100ms',

    '& .hw-view': {
      margin: '6px 10px',
    },

    '& p': {
      marginBlockStart: '1em',
      marginBlockEnd: '1em',
      marginInlineStart: '0px',
      marginInlineEnd: '0px',
    },
    '& ul, & ol, & blockquote': {
      marginBlockStart: '1em',
      marginBlockEnd: '1em',
      marginInlineStart: '0px',
      marginInlineEnd: '0px',
      paddingInlineStart: '20px',
    },
    '& blockquote': {
      borderLeft: '1px solid #666',
    },
    '& a': {
      wordWrap: 'break-word',
    },
    '& pre': {
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
    },
    '& img': {
      maxWidth: '100%',
      height: 'auto',
    },
    '& iframe': {
      border: '0',
      maxWidth: '100%',
    },
  },
});

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
  const [isDesktop, setIsDesktop] = useState(false);
  const styles = useStyles();
  const windowSize = useWindowSize();

  useEffect(() => {
    setIsDesktop(window.matchMedia(`screen and (min-width: 600px)`).matches);
  }, [windowSize]);

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
    return <F defaultMessage="Nothing to read right now!" />;
  }

  return (
    <InfiniteFeed fetchMore={fetchMore} queryName="fetchCollectionPaginated">
      {collection.map((item) => (
        <Item
          key={item.name}
          className={isDesktop && styles.item}
          content={item}
          contentOwner={contentOwner}
          isFeed={true}
        />
      ))}
    </InfiniteFeed>
  );
}
