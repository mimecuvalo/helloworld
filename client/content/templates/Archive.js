import classNames from 'classnames';
import ContentLink from '../../components/ContentLink';
import { F } from '../../../shared/i18n';
import gql from 'graphql-tag';
import React, { useContext } from 'react';
import styles from './Archive.module.css';
import { useQuery } from '@apollo/react-hooks';
import UserContext from '../../app/User_Context';

const FETCH_COLLECTION = gql`
  query($username: String!, $section: String!, $album: String!, $name: String!) {
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

export default function Archive({ content }) {
  const { username, section, album, name } = content;
  const user = useContext(UserContext);
  const { loading, data } = useQuery(FETCH_COLLECTION, {
    variables: {
      username,
      section,
      album,
      name,
    },
  });

  if (loading) {
    return <div className={styles.loadingEmptyBox} />;
  }

  const isOwnerViewing = user?.model?.username === content.username;
  const collection = data.fetchCollection;

  return (
    <ul className={styles.archive}>
      {!collection.length && (
        <li>
          <F msg="No content here yet." />
        </li>
      )}
      {collection
        .filter(item => item.name !== content.name)
        .map(item => (
          <li
            key={item.name}
            className={classNames('hw-content-item', {
              [styles.hidden]: isOwnerViewing && item.hidden,
            })}
          >
            <ContentLink item={item} currentContent={content}>
              {item.title}
            </ContentLink>
          </li>
        ))}
    </ul>
  );
}
