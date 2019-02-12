import _ from 'lodash';
import Avatar from './Avatar';
import { FormattedNumber } from '../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './RemoteUsers.module.css';

@graphql(
  gql`
    {
      fetchFeedCounts {
        from_user
        count
      }
    }
  `,
  {
    options: () => ({
      pollInterval: 60 * 1000,
    }),
  }
)
class FollowingFeeds extends PureComponent {
  render() {
    const following = this.props.following;
    const feedCounts = this.props.data.fetchFeedCounts;
    const feedCountsObj = _.keyBy(feedCounts, 'from_user');

    return (
      <>
        {following.map(follower => (
          <li key={follower.profile_url}>
            <a
              href={follower.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              title={follower.name || follower.username}
            >
              <Avatar src={follower.favicon || follower.avatar} />
              {follower.name || follower.username}
            </a>
            <span className={styles.unreadCount}>
              {feedCountsObj[follower.profile_url] ? (
                <FormattedNumber value={feedCountsObj[follower.profile_url].count} />
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
