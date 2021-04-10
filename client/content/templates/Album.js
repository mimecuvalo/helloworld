import { F, defineMessages, useIntl } from 'react-intl-wrapper';
import { useMutation, useQuery } from '@apollo/client';

import ContentLink from 'client/components/ContentLink';
import ContentThumb from 'client/components/ContentThumb';
import classNames from 'classnames';
import { createUseStyles } from 'react-jss';
import { forwardRef } from 'react';
import gql from 'graphql-tag';
import { useSnackbar } from 'notistack';

const useStyles = createUseStyles({
  album: {
    listStyle: 'none',
  },
  loadingEmptyBox: {
    minHeight: '100vh',
  },
  item: {
    position: 'relative',
    display: 'inline-block',
    overflow: 'hidden',
    verticalAlign: 'top',
    textAlign: 'center',
    margin: '3px',
    transition: 'all 0.2s ease-out',
    boxShadow: '0px 0px 0px 1px transparent',
    '&:hover': {
      boxShadow: '0px 0px 0px 1px #06e',
    },
  },
  link: {
    display: 'block',
    width: 'var(--thumb-width)',
    maxWidth: 'var(--thumb-width)',
  },
  title: {
    minHeight: '1.1em',
  },
  delete: {
    position: 'absolute',
    top: '5px',
    right: '5px',
  },
});

const messages = defineMessages({
  error: { msg: 'Error deleting content.' },
});

const FETCH_COLLECTION = gql`
  query($username: String!, $section: String!, $album: String!, $name: String!) {
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
    }
  }
`;

const DELETE_CONTENT = gql`
  mutation deleteContent($name: String!) {
    deleteContent(name: $name)
  }
`;

export default forwardRef(({ content, isEditing }, ref) => {
  const { username, section, album, name } = content;
  const intl = useIntl();
  const snackbar = useSnackbar();
  const styles = useStyles();

  const { loading, data } = useQuery(FETCH_COLLECTION, {
    variables: {
      username,
      section,
      album,
      name,
    },
  });

  const [deleteContent] = useMutation(DELETE_CONTENT);

  const handleClick = async (item) => {
    const variables = { name: item.name };

    try {
      await deleteContent({
        variables,
        optimisticResponse: {
          __typename: 'Mutation',
          deleteContent: true,
        },
        update: (store, { data: { deleteContent } }) => {
          const { username, section, album, name } = content;
          const queryVariables = { username, section, album, name };
          const data = store.readQuery({ query: FETCH_COLLECTION, variables: queryVariables });
          store.writeQuery({
            query: FETCH_COLLECTION,
            data: { fetchCollection: data.fetchCollection.filter((i) => i.name !== item.name) },
            variables: queryVariables,
          });
        },
      });
    } catch (ex) {
      snackbar.enqueueSnackbar(intl.formatMessage(messages.error), { variant: 'error' });
    }
  };

  if (loading) {
    return <div className={styles.loadingEmptyBox} />;
  }

  const collection = data.fetchCollection;

  return (
    <ul className={styles.album}>
      {!collection.length && (
        <li>
          <F msg="No content here yet." />
        </li>
      )}
      {collection.map((item) => (
        <li key={item.name} className={styles.item}>
          {isEditing ? (
            <button className={classNames('hw-button', 'hw-delete', styles.delete)} onClick={() => handleClick(item)}>
              x
            </button>
          ) : null}
          <ContentThumb isEditing={isEditing} item={item} currentContent={content} />
          {!isEditing && item.externalLink ? (
            <a
              className={classNames('hw-album-title', styles.title, styles.link, 'notranslate')}
              href={item.externalLink}
              target="_blank"
              rel="noreferrer noopener"
            >
              {item.title}
            </a>
          ) : item.title ? (
            <ContentLink
              item={item}
              currentContent={content}
              className={classNames('hw-album-title', styles.title, styles.link, 'notranslate')}
            >
              {item.title}
            </ContentLink>
          ) : null}
        </li>
      ))}
    </ul>
  );
});
