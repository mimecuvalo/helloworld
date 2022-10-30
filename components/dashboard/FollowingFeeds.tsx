import { Avatar, Button, Chip, ListItem } from 'components';
import { FetchFeedCountsQuery, UserRemotePublic } from 'data/graphql-generated';

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
  const feedCountsObj = keyBy(feedCounts, 'fromUsername');

  return (
    <>
      {following.map((userRemote) => (
        <ListItem
          key={userRemote.profileUrl}
          style={{ fontWeight: currentUserRemote?.profileUrl === userRemote.profileUrl ? 'bold' : 'normal' }}
        >
          <Button
            className="notranslate"
            onClick={(evt) => handleClick(evt, userRemote)}
            title={userRemote.name || userRemote.username}
            startIcon={<Avatar src={userRemote.favicon || userRemote.avatar} sx={{ width: 16, height: 16 }} />}
            endIcon={
              <Chip
                color="info"
                size="small"
                className="notranslate"
                label={<FormattedNumber value={feedCountsObj[userRemote.profileUrl]?.count || 0} />}
              />
            }
          >
            <span className="feed-name">{userRemote.name || userRemote.username}</span>
          </Button>
          <FollowingMenu userRemote={userRemote} handleSetFeed={handleSetFeed} />
        </ListItem>
      ))}
    </>
  );
}
