import _ from 'lodash';
import Avatar from './Avatar';
import classNames from 'classnames';
import FollowingFeedsQuery from './FollowingFeedsQuery';
import { FormattedNumber } from '../../shared/i18n';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './RemoteUsers.module.css';

@graphql(FollowingFeedsQuery, {
  options: () => ({
    pollInterval: 60 * 1000,
  }),
})
class FollowingFeeds extends PureComponent {
  handleClick = (evt, userRemote) => {
    evt.preventDefault();
    this.props.handleSetFeed(userRemote);
  };

  render() {
    const following = this.props.following;
    const feedCounts = this.props.data.fetchFeedCounts;
    const feedCountsObj = _.keyBy(feedCounts, 'from_user');
    const currentUserRemote = this.props.currentUserRemote || {};

    return (
      <>
        {following.map(userRemote => (
          <li
            key={userRemote.profile_url}
            className={classNames({ [styles.selected]: currentUserRemote.profile_url === userRemote.profile_url })}
          >
            <a
              href="#open-feed"
              onClick={evt => this.handleClick(evt, userRemote)}
              title={userRemote.name || userRemote.username}
            >
              <Avatar src={userRemote.favicon || userRemote.avatar} />
              {userRemote.name || userRemote.username}
            </a>
            <span className={styles.unreadCount}>
              {feedCountsObj[userRemote.profile_url] ? (
                <FormattedNumber value={feedCountsObj[userRemote.profile_url].count} />
              ) : (
                '0'
              )}
            </span>
          </li>
        ))}
      </>
    );
  }
}

export default FollowingFeeds;
