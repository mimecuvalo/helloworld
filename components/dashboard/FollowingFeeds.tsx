import Avatar from './Avatar';
import FollowingFeedCountsQuery from './FollowingFeedCountsQuery';
import FollowingMenu from './FollowingMenu';
import { FormattedNumber } from 'i18n';
import classNames from 'classnames';
import keyBy from 'lodash/keyBy';
import { useQuery } from '@apollo/client';

export default function FollowingFeeds({
  pollInterval,
  handleSetFeed,
  following,
  currentUserRemote = {},
}: {
  pollInterval: number;
  handleSetFeed: (userRemote: UserRemote) => void;
  following: boolean;
  currentUserRemote: UserRemote;
}) {
  const { loading, data } = useQuery(FollowingFeedCountsQuery, {
    pollInterval: pollInterval,
  });

  if (loading) {
    return null;
  }

  const handleClick = (evt, userRemote) => {
    handleSetFeed(userRemote);
  };

  const feedCounts = data.fetchFeedCounts;
  const feedCountsObj = keyBy(feedCounts, 'from_user');

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
          <FollowingMenu userRemote={userRemote} handleSetFeed={handleSetFeed} />
        </li>
      ))}
    </>
  );
}
