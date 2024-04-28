import { Alert, Snackbar, styled } from 'components';
import { gql, useQuery } from '@apollo/client';

import { Content } from 'data/graphql-generated';
import ContentThumb from 'components/ContentThumb';
import { F } from 'i18n';
import { useEffect, useState } from 'react';
import ContentLink from '@/components/ContentLink';
import { THUMB_WIDTH } from '@/util/constants';
import { useRouter } from 'next/router';
import { contentUrl } from '@/util/url-factory';

const StyledAlbum = styled('ul')`
  list-style: none;
  padding: 0;
`;

const LoadingEmptyBox = styled('div')`
  min-height: 100vh;
`;

const Item = styled('li')`
  position: relative;
  display: inline-block;
  overflow: hidden;
  vertical-align: top;
  text-align: center;
  margin: ${(props) => props.theme.spacing(0.5)};
  transition: all 0.2s ease-out;
  box-shadow: 0 0 0 1px transparent;

  &:hover {
    box-shadow: 0 0 0 1px ${(props) => props.theme.palette.primary.main};
  }
`;

const LinkWrapper = styled('span')`
  & a {
    display: block;
    width: ${THUMB_WIDTH}px;
    max-width: ${THUMB_WIDTH}px;
    min-height: 1.1em;
  }
`;

// const DeleteButton = styled(IconButton)`
//   position: absolute;
//   top: ${(props) => props.theme.spacing(0.5)};
//   right: ${(props) => props.theme.spacing(0.5)};
// `;

// const messages = defineMessages({
//   error: { defaultMessage: 'Error deleting content.' },
// });

const FETCH_COLLECTION = gql`
  query FetchAlbumCollection($username: String!, $section: String!, $album: String!, $name: String!) {
    fetchCollection(username: $username, section: $section, album: $album, name: $name) {
      album
      externalLink
      forceRefresh
      hidden
      name
      section
      thumb
      title
      username
      prefetchImages
    }
  }
`;

// const DELETE_CONTENT = gql`
//   mutation deleteContent($name: String!) {
//     deleteContent(name: $name)
//   }
// `;

export default function Album({ content }: { content: Content }) {
  const { username, section, album, name } = content;
  const [errorMsg] = useState('');
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [currentIndexOpen, setCurrentIndexOpen] = useState(-1);
  const router = useRouter();

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  });

  const handleNext = () => {
    const nextIndex = Math.min(collection.length - 1, currentIndexOpen + 1);
    router.replace(contentUrl(collection[nextIndex]), undefined, { shallow: true });
    setCurrentIndexOpen(nextIndex);
  };
  const handlePrev = () => {
    const nextIndex = Math.max(0, currentIndexOpen - 1);
    router.replace(contentUrl(collection[nextIndex]), undefined, { shallow: true });
    setCurrentIndexOpen(nextIndex);
  };

  const handleKeyUp = (evt: KeyboardEvent) => {
    if (currentIndexOpen === -1) {
      return;
    }

    switch (evt.key) {
      case 'ArrowLeft':
        handlePrev();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      default:
        break;
    }
  };

  const { loading, data } = useQuery(FETCH_COLLECTION, {
    variables: {
      username,
      section,
      album,
      name,
    },
  });

  // const [deleteContent] = useMutation(DELETE_CONTENT);

  const handleToastClose = () => setIsToastOpen(false);

  // const handleClick = async (item: Content) => {
  //   const variables = { name: item.name };

  //   try {
  //     await deleteContent({
  //       variables,
  //       optimisticResponse: {
  //         __typename: 'Mutation',
  //         deleteContent: true,
  //       },
  //       update: (store) => {
  //         const { username, section, album, name } = content;
  //         const queryVariables = { username, section, album, name };
  //         const data = store.readQuery({ query: FETCH_COLLECTION, variables: queryVariables });
  //         store.writeQuery({
  //           query: FETCH_COLLECTION,
  //           data: { fetchCollection: data.fetchCollection.filter((i: Content) => i.name !== item.name) },
  //           variables: queryVariables,
  //         });
  //       },
  //     });
  //   } catch (ex) {
  //     setErrorMsg(intl.formatMessage(messages.error));
  //     setIsToastOpen(true);
  //   }
  // };

  if (loading) {
    return <LoadingEmptyBox />;
  }

  const collection = data.fetchCollection;

  return (
    <>
      <StyledAlbum>
        {!collection.length && (
          <li>
            <F defaultMessage="No content here yet." />
          </li>
        )}
        {collection.map((item: Content, index: number) => (
          <Item key={item.name}>
            {/* {isEditing ? (
              <DeleteButton onClick={() => handleClick(item)}>
                x
              </DeleteButton>
            ) : null} */}
            <ContentThumb
              item={item}
              currentContent={content}
              isOpen={currentIndexOpen === index}
              onOpen={() => {
                router.replace(contentUrl(collection[index]), undefined, { shallow: true });
                setCurrentIndexOpen(index);
              }}
              handlePrev={handlePrev}
              handleNext={handleNext}
              onClose={() => {
                router.replace(contentUrl(content), undefined, { shallow: true });
                setCurrentIndexOpen(-1);
              }}
            />
            {item.title && (
              <LinkWrapper>
                {/* {!isEditing && item.externalLink ? (
                <a
                  className="notranslate"
                  href={item.externalLink}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {item.title}
                </a>
              ) : item.title ? (
                <ContentLink item={item} currentContent={content} className="notranslate">
                  {item.title}
                </ContentLink>
              ) : null} */}
                <ContentLink item={item} currentContent={content} className="notranslate">
                  {item.title}
                </ContentLink>
              </LinkWrapper>
            )}
          </Item>
        ))}
      </StyledAlbum>

      <Snackbar open={isToastOpen} autoHideDuration={3000} onClose={handleToastClose}>
        <Alert elevation={6} variant="filled" onClose={handleToastClose} severity="error" sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
