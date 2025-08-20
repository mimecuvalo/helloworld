import { Alert, IconButton, Snackbar, styled } from 'components';
import { gql, useMutation, useQuery } from '@apollo/client';

import { Content, DeleteContentMutation, FetchAlbumCollectionQuery } from 'data/graphql-generated';
import ContentThumb from 'components/ContentThumb';
import { defineMessages, F, useIntl } from 'i18n';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { contentUrl } from '@/util/url-factory';
import { transientOptions } from '@/util/css';
import { useEditor } from 'application/EditorContext';

// N.B. the && is overriding ItemWrapper's ul styles which isn't great.
const StyledAlbum = styled('ul')`
  && {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  ${(props) => props.theme.breakpoints.down('sm')} {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${(props) => props.theme.spacing(0.5)};
  }
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

  ${(props) => props.theme.breakpoints.down('sm')} {
    margin: 0;

    & a,
    & img {
      width: 100%;
      max-width: 100%;
      height: auto;
      aspect-ratio: 1;
    }
  }
`;

const TitleWrapper = styled('span', { ...transientOptions })<{ $isHidden: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.82);
  color: #3984ff;
  padding: 4px;
  pointer-events: none;

  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;

  ${(props) => props.$isHidden && 'font-style: italic;'}
`;

const DeleteButton = styled(IconButton)`
  position: absolute;
  top: ${(props) => props.theme.spacing(0.5)};
  right: ${(props) => props.theme.spacing(0.5)};
`;

const messages = defineMessages({
  error: { defaultMessage: 'Error deleting content.' },
});

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

const DELETE_CONTENT = gql`
  mutation deleteContent($name: String!) {
    deleteContent(name: $name)
  }
`;

export default function Album({ content }: { content: Content }) {
  const { username, section, album, name } = content;
  const [errorMsg, setErrorMsg] = useState('');
  const intl = useIntl();
  const { isEditing } = useEditor();
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [currentIndexOpen, setCurrentIndexOpen] = useState(-1);
  const router = useRouter();

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  });

  const setItem = (index: number) => {
    const item = collection[index];
    if (index + 1 < collection.length) {
      collection[index + 1].prefetchImages?.forEach((img) => (new Image().src = img));
    }
    if (index - 1 >= 0) {
      collection[index - 1].prefetchImages?.forEach((img) => (new Image().src = img));
    }
    router.replace(contentUrl(item), undefined, { shallow: true });
    setCurrentIndexOpen(index);
  };

  const handleNext = () => setItem(Math.min(collection.length - 1, currentIndexOpen + 1));
  const handlePrev = () => setItem(Math.max(0, currentIndexOpen - 1));

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

  const { loading, data } = useQuery<FetchAlbumCollectionQuery>(FETCH_COLLECTION, {
    variables: {
      username,
      section,
      album,
      name,
    },
  });

  const [deleteContent] = useMutation<DeleteContentMutation>(DELETE_CONTENT);

  const handleToastClose = () => setIsToastOpen(false);

  const handleClick = async (item: Content) => {
    const variables = { name: item.name };

    try {
      await deleteContent({
        variables,
        optimisticResponse: {
          __typename: 'Mutation',
          deleteContent: true,
        },
        update: (store) => {
          const { username, section, album, name } = content;
          const queryVariables = { username, section, album, name };
          const data = store.readQuery<FetchAlbumCollectionQuery>({
            query: FETCH_COLLECTION,
            variables: queryVariables,
          });
          store.writeQuery({
            query: FETCH_COLLECTION,
            data: { fetchCollection: data?.fetchCollection.filter((i) => i.name !== item.name) },
            variables: queryVariables,
          });
        },
      });
    } catch {
      setErrorMsg(intl.formatMessage(messages.error));
      setIsToastOpen(true);
    }
  };

  if (loading) {
    return <LoadingEmptyBox />;
  }

  const collection = data?.fetchCollection || [];

  return (
    <>
      <StyledAlbum>
        {!collection.length && (
          <li>
            <F defaultMessage="No content here yet." />
          </li>
        )}
        {collection.map((item, index) => (
          <Item key={item.name}>
            {isEditing ? (
              <DeleteButton color="error" className="notranslate" onClick={() => handleClick(item as Content)}>
                x
              </DeleteButton>
            ) : null}
            <ContentThumb
              item={item as Content}
              currentContent={content}
              isOpen={currentIndexOpen === index}
              onOpen={() => setItem(index)}
              handlePrev={handlePrev}
              handleNext={handleNext}
              onClose={() => {
                router.replace(contentUrl(content), undefined, { shallow: true });
                setCurrentIndexOpen(-1);
              }}
            />
            {item.title && (
              <TitleWrapper className="notranslate" $isHidden={item.hidden}>
                {item.title}
              </TitleWrapper>
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
