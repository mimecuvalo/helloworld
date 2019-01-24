import classNames from 'classnames';
import { contentUrl } from '../../../shared/util/url_factory';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './Archive.module.css';
import UserContext from '../../app/User_Context';

@graphql(gql`
  query ($username: String!, $section: String!, $name: String!) {
    fetchCollection(username: $username, section: $section, name: $name) {
      album
      name
      section
      title
      username
    }
  }
`, {
  options: ({ content: { username, section, name } }) => ({
    variables: {
      username,
      section,
      name,
    }
  })
})
class Archive extends PureComponent {
  static contextType = UserContext;

  render() {
    const content = this.props.content;
    const isOwnerViewing = this.context.user && this.context.user.model.username === content.username;
    const collection = this.props.data.fetchCollection;

    return (
      <ul className="hw-archive">
        {collection
            .filter(item => item.name !== content.name)
            .map(item =>
              <li key={item.name} className={classNames('hw-content-item', {
                    [styles.hidden]: isOwnerViewing && item.hidden
                  })}>
                <a href={contentUrl(item)} title={item.title}>{item.title}</a>
              </li>
            )
        }
      </ul>
    );
  }
}

export default Archive;
