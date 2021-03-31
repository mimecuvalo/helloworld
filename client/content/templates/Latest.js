import Archive from './Archive';
import { contentUrl } from '../../../shared/util/url_factory';
import gql from 'graphql-tag';
import React, { useEffect, useState } from 'react';
import Simple from './Simple';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@apollo/client';

const FETCH_COLLECTION_LINKS = gql`
  query($username: String!, $section: String!, $name: String!) {
    fetchCollectionLatest(username: $username, section: $section, name: $name) {
      album
      name
      section
      title
      username
      view
      content
    }
  }
`;

export default React.forwardRef(({ content }, ref) => {
  const { username, section, name } = content;
  const routerHistory = useHistory();
  const [archiveMode, setArchiveMode] = useState(false);
  const { loading, data } = useQuery(FETCH_COLLECTION_LINKS, {
    variables: {
      username,
      section,
      name,
    },
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('mode') === 'archive') {
      setArchiveMode(true);
    } else {
      // XXX(mime): we do setTimeout 0 because in Content.js we replace history with the canonical url
      // so it's a shitty race condition :-/
      setTimeout(() => routerHistory.replace(contentUrl(data.fetchCollectionLatest)), 0);
    }
  }, [archiveMode, data, routerHistory]);

  if (archiveMode) {
    return <Archive content={content} />;
  }

  if (loading) {
    return null;
  }

  return <Simple content={data.fetchCollectionLatest} />;
});
