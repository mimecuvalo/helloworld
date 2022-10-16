import { gql, useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';

import Archive from './Archive';
import { Content } from 'data/graphql-generated';
import Simple from './Simple';
import { contentUrl } from 'util/url-factory';
import { useRouter } from 'next/router';

const FETCH_COLLECTION_LINKS = gql`
  query ($username: String!, $section: String!, $name: String!) {
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

export default function Latest({ content }: { content: Content }) {
  const { username, section, name } = content;
  const router = useRouter();
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
      setTimeout(() => router.replace(contentUrl(data.fetchCollectionLatest)), 0);
    }
  }, [archiveMode, data, router]);

  if (archiveMode) {
    return <Archive content={content} />;
  }

  if (loading) {
    return <></>;
  }

  return <Simple content={data.fetchCollectionLatest} />;
}
