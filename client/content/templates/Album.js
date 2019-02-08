import classNames from 'classnames';
import { contentUrl } from '../../../shared/util/url_factory';
import DelayLoadedThumb from './Thumb';
import { F } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { Link } from 'react-router-dom';
import React, { PureComponent } from 'react';
import styles from './Album.module.css';
import UserContext from '../../app/User_Context';

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
  static contextType = UserContext;

  render() {
    if (this.props.data.loading) {
      return <div className={styles.loadingEmptyBox} />;
    }

    const content = this.props.content;
    const isOwnerViewing = this.context.user?.model?.username === content.username;
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
            <Link
              to={contentUrl(item)}
              className={styles.thumbLink}
              title={item.title}
              target={item.forceRefresh ? '_self' : ''}
            >
              <DelayLoadedThumb item={item} />
            </Link>
            <Link
              to={contentUrl(item)}
              title={item.title}
              className={classNames('hw-album-title', styles.title, styles.link, {
                [styles.hidden]: isOwnerViewing && item.hidden,
              })}
              target={item.forceRefresh ? '_self' : ''}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
}

export default Album;
