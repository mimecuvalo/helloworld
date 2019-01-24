import Avatar from './Avatar';
import classNames from 'classnames';
import { F } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './RemoteUsers.module.css';

@graphql(gql`
  {
    fetchFollowers {
      avatar
      favicon
      name
      profile_url
      username
    }
  }
`)
class Followers extends PureComponent {
  render() {
    const followers = this.props.data.fetchFollowers;

    return (
      <div className={classNames(this.props.className, styles.remoteUsers)}>
        <h2><F msg="followers" /></h2>
        <ul>
          {followers.map(follower =>
            <li key={follower.profile_url}>
              <a href={follower.profile_url} target="_blank" rel="noopener noreferrer">
                <Avatar src={follower.favicon || follower.avatar} />
                { follower.name || follower.username }
              </a>
            </li>
          )}
        </ul>
      </div>
    );
  }
}

export default Followers;
