import { List, ListItem, styled } from 'components';
import { gql, useQuery } from '@apollo/client';

import { Content } from 'data/graphql-generated';
import ContentLink from 'components/ContentLink';
import { F } from 'i18n';

const StyledArchive = styled(List)`
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
        <ListItem>
          <F defaultMessage="No content here yet." />
        </ListItem>
      )}
      {collection
        .filter((item: Content) => item.name !== content.name)
        .map((item: Content) => (
          <ListItem key={item.name}>
            <ContentLink item={item} currentContent={content}>
              {item.title}
            </ContentLink>
          </ListItem>
        ))}
    </StyledArchive>
  );
}
