import { forwardRef, useContext } from 'react';

import ContentLink from 'client/components/ContentLink';
import { F } from 'shared/util/i18n';
import UserContext from 'client/app/User_Context';
import classNames from 'classnames';
import { createUseStyles } from 'react-jss';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';

const useStyles = createUseStyles({
  archive: {
    listStyle: 'inside square',
    padding: '10px',
  },
  loadingEmptyBox: {
    minHeight: '100vh',
  },
});

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

export default forwardRef(({ content }, ref) => {
  const { username, section, album, name } = content;
  const user = useContext(UserContext).user;
  const { loading, data } = useQuery(FETCH_COLLECTION, {
    variables: {
      username,
      section,
      album,
      name,
    },
  });
  const styles = useStyles();

  if (loading) {
    return <div className={styles.loadingEmptyBox} />;
  }

  const isOwnerViewing = user?.model?.username === content.username;
  const collection = data.fetchCollection;

  return (
    <ul className={styles.archive}>
      {!collection.length && (
        <li>
          <F defaultMessage="No content here yet." />
        </li>
      )}
      {collection
        .filter((item) => item.name !== content.name)
        .map((item) => (
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
});
