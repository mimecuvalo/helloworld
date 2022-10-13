import { gql, useQuery } from '@apollo/client';

import ContentLink from 'components/ContentLink';
import { F } from 'i18n';
import { styled } from 'components';

const StyledArchive = styled('ul')`
  list-style: inside square;
`;

const LoadingEmptyBox = styled('div')`
  min-height: 100vh;
`;

const FETCH_COLLECTION = gql`
  query ($username: String!, $section: String!, $album: String!, $name: String!) {
    fetchCollection(username: $username, section: $section, album: $album, name: $name) {
      album
      forceRefresh
      hidden
      name
      section
      title
      username
    }
  }
`;

export default function Archive({ content }: { content: Content }) {
  const { username, section, album, name } = content;
  const { loading, data } = useQuery(FETCH_COLLECTION, {
    variables: {
      username,
      section,
      album,
      name,
    },
  });

  if (loading) {
    return <LoadingEmptyBox />;
  }

  const collection = data.fetchCollection;

  return (
    <StyledArchive>
      {!collection.length && (
        <li>
          <F defaultMessage="No content here yet." />
        </li>
      )}
      {collection
        .filter((item: Content) => item.name !== content.name)
        .map((item: Content) => (
          <li key={item.name} className="hw-content-item">
            <ContentLink item={item} currentContent={content}>
              {item.title}
            </ContentLink>
          </li>
        ))}
    </StyledArchive>
  );
}
