import classNames from 'classnames';
import { contentUrl } from '../../../shared/util/url_factory';
import { F } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { Link } from 'react-router-dom';
import React, { PureComponent } from 'react';
import styles from './Archive.module.css';
import UserContext from '../../app/User_Context';

@graphql(
  gql`
    query($username: String!, $section: String!, $album: String!, $name: String!) {
      fetchCollection(username: $username, section: $section, album: $album, name: $name) {
        album
        hidden
        name
        section
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
class Archive extends PureComponent {
  static contextType = UserContext;

  render() {
    if (this.props.data.loading) {
      return <div className={styles.loadingEmptyBox} />;
    }

    const content = this.props.content;
    const isOwnerViewing = this.context.user?.model?.username === content.username;
    const collection = this.props.data.fetchCollection;

    return (
      <ul className={styles.archive}>
        {!collection.length && (
          <li>
            <F msg="No content here yet." />
          </li>
        )}
        {collection.filter(item => item.name !== content.name).map(item => (
          <li
            key={item.name}
            className={classNames('hw-content-item', {
              [styles.hidden]: isOwnerViewing && item.hidden,
            })}
          >
            <Link to={contentUrl(item)} title={item.title}>
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
}

export default Archive;
