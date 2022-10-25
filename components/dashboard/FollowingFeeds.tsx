import { FetchFeedCountsQuery, UserRemotePublic } from 'data/graphql-generated';

import { Avatar } from 'components';
import FollowingFeedCountsQuery from './FollowingFeedCountsQuery';
import FollowingMenu from './FollowingMenu';
import { FormattedNumber } from 'i18n';
import { MouseEvent } from 'react';
import keyBy from 'lodash/keyBy';
import { useQuery } from '@apollo/client';

export default function FollowingFeeds({
  pollInterval,
  handleSetFeed,
  following,
  currentUserRemote,
}: {
  pollInterval: number;
  handleSetFeed: (userRemote: UserRemotePublic | string, search?: string) => void;
  following: UserRemotePublic[];
  currentUserRemote: UserRemotePublic | null;
}) {
  const { loading, data } = useQuery<FetchFeedCountsQuery>(FollowingFeedCountsQuery, {
    pollInterval: pollInterval,
  });

  if (loading || !data) {
    return null;
  }

  const handleClick = (evt: MouseEvent, userRemote: UserRemotePublic) => {
    handleSetFeed(userRemote);
  };

  const feedCounts = data.fetchFeedCounts;
  const feedCountsObj = keyBy(feedCounts, 'from_user');

  return (
    <>
      {following.map((userRemote) => (
        <li
          key={userRemote.profileUrl}
          style={{ fontWeight: currentUserRemote?.profileUrl === userRemote.profileUrl ? 'bold' : 'normal' }}
        >
          <button
            className="notranslate"
            onClick={(evt) => handleClick(evt, userRemote)}
            title={userRemote.name || userRemote.username}
          >
            <Avatar src={userRemote.favicon || userRemote.avatar} />
            {userRemote.name || userRemote.username}
          </button>
          <span>
            {feedCountsObj[userRemote.profileUrl] ? (
              <FormattedNumber value={feedCountsObj[userRemote.profileUrl].count} />
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
