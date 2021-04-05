import _ from 'lodash';
import Avatar from './Avatar';
import classNames from 'classnames';
import { FormattedNumber } from 'react-intl-wrapper';
import FollowingFeedCountsQuery from './FollowingFeedCountsQuery';
import FollowingMenu from './FollowingMenu';
import { useQuery } from '@apollo/client';
import useStyles from './remoteUsersStyles';

export default function FollowingFeeds(props) {
  const { loading, data } = useQuery(FollowingFeedCountsQuery, {
    pollInterval: props.pollInterval,
  });
  const styles = useStyles();

  if (loading) {
    return null;
  }

  const handleClick = (evt, userRemote) => {
    props.handleSetFeed(userRemote);
  };

  const following = props.following;
  const feedCounts = data.fetchFeedCounts;
  const feedCountsObj = _.keyBy(feedCounts, 'from_user');
  const currentUserRemote = props.currentUserRemote || {};

  return (
    <>
      {following.map((userRemote) => (
        <li
          key={userRemote.profile_url}
          className={classNames({ [styles.selected]: currentUserRemote.profile_url === userRemote.profile_url })}
        >
          <button
            className="hw-button-link notranslate"
            onClick={(evt) => handleClick(evt, userRemote)}
            title={userRemote.name || userRemote.username}
          >
            <Avatar src={userRemote.favicon || userRemote.avatar} />
            {userRemote.name || userRemote.username}
          </button>
          <span className={styles.unreadCount}>
            {feedCountsObj[userRemote.profile_url] ? (
              <FormattedNumber value={feedCountsObj[userRemote.profile_url].count} />
            ) : (
              '0'
            )}
          </span>
          <FollowingMenu userRemote={userRemote} handleSetFeed={props.handleSetFeed} />
        </li>
      ))}
    </>
  );
}
