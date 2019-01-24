import Avatar from './Avatar';
import classNames from 'classnames';
import { F } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './RemoteUsers.module.css';
import UserContext from '../app/User_Context';

@graphql(gql`
  {
    fetchFollowing {
      avatar
      favicon
      name
      profile_url
      username
    }
  }
`)
class Following extends PureComponent {
  static contextType = UserContext;

  render() {
    const following = this.props.data.fetchFollowing;
    const unreadEntries = 0; // TODO(mime)
    const totalCount = 0;  // TODO(mime)
    const userFavicon = this.context.user.model.favicon;
    const userAvatar = <Avatar src={userFavicon || '/favicon.ico'} />;
    const favoritesCount = 0; // TODO(mime)
    const commentsCount = 0; // TODO(mime)

    return (
      <div className={classNames(this.props.className, styles.remoteUsers)}>
        <h2><F msg="following" /></h2>
        <ul>
          <li>
            <a href="#read-all">
              <F msg="read all" />
            </a>
            <span className={styles.unreadCount}>{totalCount}</span>
          </li>
          <li>
            <a href="#your-feed">
              {userAvatar}
              <F msg="your feed" />
            </a>
          </li>
          <li>
            <a href="#your-favorites">
              {userAvatar}
              <F msg="favorites" />
            </a>
            <span className={styles.unreadCount}>{favoritesCount}</span>
          </li>
          <li>
            <a href="#comments">
              {userAvatar}
              <F msg="comments" />
            </a>
            <span className={styles.unreadCount}>{commentsCount}</span>
          </li>
          {following.map(follower =>
            <li key={follower.profile_url}>
              <a href={follower.profile_url} target="_blank" rel="noopener noreferrer"
                 title={ follower.name || follower.username }>
                <Avatar src={follower.favicon || follower.avatar} />
                { follower.name || follower.username }
              </a>
              <span className={styles.unreadCount}>{unreadEntries}</span>
            </li>
          )}
        </ul>
      </div>
    );
  }
}

export default Following;
