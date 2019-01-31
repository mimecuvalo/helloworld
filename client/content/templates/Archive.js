import classNames from 'classnames';
import { contentUrl } from '../../../shared/util/url_factory';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { Link } from 'react-router-dom';
import React, { PureComponent } from 'react';
import styles from './Archive.module.css';
import UserContext from '../../app/User_Context';

@graphql(
  gql`
    query($username: String!, $section: String!, $name: String!) {
      fetchCollection(username: $username, section: $section, name: $name) {
        album
        name
        section
        title
        username
      }
    }
  `,
  {
    options: ({ content: { username, section, name } }) => ({
      variables: {
        username,
        section,
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
    const isOwnerViewing = this.context.user?.model.username === content.username;
    const collection = this.props.data.fetchCollection;

    return (
      <ul className="hw-archive">
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
