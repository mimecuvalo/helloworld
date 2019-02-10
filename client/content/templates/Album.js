import classNames from 'classnames';
import ContentLink from '../../components/ContentLink';
import ContentThumb from '../../components/ContentThumb';
import { F } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './Album.module.css';

@graphql(
  gql`
    query($username: String!, $section: String!, $album: String!, $name: String!) {
      fetchCollection(username: $username, section: $section, album: $album, name: $name) {
        album
        forceRefresh
        hidden
        name
        section
        thumb
        title
        username
      }
    }
  `,
  {
    options: ({ content: { username, section, album, name } }) => ({
      variables: {
        username,
        section,
        album,
        name,
      },
    }),
  }
)
class Album extends PureComponent {
  render() {
    if (this.props.data.loading) {
      return <div className={styles.loadingEmptyBox} />;
    }

    const content = this.props.content;
    const collection = this.props.data.fetchCollection;

    return (
      <ul className={styles.album}>
        {!collection.length && (
          <li>
            <F msg="No content here yet." />
          </li>
        )}
        {collection.map(item => (
          <li key={item.name} className={styles.item}>
            <ContentThumb item={item} currentContent={content} />
            <ContentLink
              item={item}
              currentContent={content}
              className={classNames('hw-album-title', styles.title, styles.link)}
            >
              {item.title}
            </ContentLink>
          </li>
        ))}
      </ul>
    );
  }
}

export default Album;
