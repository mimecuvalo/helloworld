import Avatar from './Avatar';
import classNames from 'classnames';
import { F } from '../../shared/i18n';
import FollowerMenu from './FollowerMenu';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './RemoteUsers.module.css';

@graphql(gql`
  {
    fetchFollowers {
      avatar
      favicon
      following
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
        <h2>
          <F msg="followers" />
        </h2>
        <ul>
          {followers.map(follower => (
            <li key={follower.profile_url}>
              <button
                className="hw-button-link"
                onClick={() => window.open(follower.profile_url, follower.profile_url, 'noopener,noreferrer')}
              >
                <Avatar src={follower.favicon || follower.avatar} />
                {follower.name || follower.username}
              </button>
              <FollowerMenu userRemote={follower} handleSetFeed={this.props.handleSetFeed} />
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default Followers;
