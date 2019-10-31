import classNames from 'classnames';
import ContentLink from '../../components/ContentLink';
import ContentThumb from '../../components/ContentThumb';
import { defineMessages, F, useIntl } from '../../../shared/i18n';
import gql from 'graphql-tag';
import React from 'react';
import styles from './Album.module.css';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { useSnackbar } from 'notistack';

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

export default function Album({ content, isEditing }) {
  const { username, section, album, name } = content;
  const intl = useIntl();
  const snackbar = useSnackbar();

  const { loading, data } = useQuery(FETCH_COLLECTION, {
    variables: {
      username,
      section,
      album,
      name,
    },
  });

  const [deleteContent] = useMutation(DELETE_CONTENT);

  const handleClick = async item => {
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
            data: { fetchCollection: data.fetchCollection.filter(i => i.name !== item.name) },
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
      {collection.map(item => (
        <li key={item.name} className={styles.item}>
          {isEditing ? (
            <button className={classNames('hw-button', 'hw-delete', styles.delete)} onClick={() => handleClick(item)}>
              x
            </button>
          ) : null}
          <ContentThumb isEditing={isEditing} item={item} currentContent={content} />
          {!isEditing && item.externalLink ? (
            <a
              className={classNames('hw-album-title', styles.title, styles.link)}
              href={item.externalLink}
              target="_blank"
              rel="noreferrer noopener"
            >
              {item.title}
            </a>
          ) : (
            <ContentLink
              item={item}
              currentContent={content}
              className={classNames('hw-album-title', styles.title, styles.link)}
            >
              {item.title}
            </ContentLink>
          )}
        </li>
      ))}
    </ul>
  );
}
