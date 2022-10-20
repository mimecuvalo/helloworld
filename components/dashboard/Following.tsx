import { F, defineMessages, useIntl } from 'i18n';
import { FetchFollowingQuery, UserRemotePublic } from 'data/graphql-generated';
import { KeyboardEvent, useRef } from 'react';

import FollowingFeeds from './FollowingFeeds';
import FollowingQuery from './FollowingQuery';
import FollowingSpecialFeeds from './FollowingSpecialFeeds';
import NewFeed from './actions/NewFeed';
import { useQuery } from '@apollo/client';

const messages = defineMessages({
  search: { defaultMessage: 'search' },
});

const POLL_INTERVAL = 60 * 1000;

export default function Following({
  userRemote,
  handleSetFeed,
  specialFeed,
}: {
  specialFeed: string;
  userRemote: UserRemotePublic | null;
  handleSetFeed: (userRemote: UserRemotePublic | string, search?: string) => void;
}) {
  const intl = useIntl();
  const searchInput = useRef<HTMLInputElement>(null);
  const { loading, data } = useQuery<FetchFollowingQuery>(FollowingQuery);

  if (loading || !data) {
    return null;
  }

  const handleSearchKeyUp = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter') {
      handleSetFeed('', searchInput.current?.value || '');
    }
  };

  // It'd be nice to listen to the 'search' event for the (x) cancel button but it doesn't work w/ React?
  const handleSearchChange = () => {
    if (!searchInput.current?.value) {
      handleSetFeed('', searchInput.current?.value || '');
    }
  };

  const following = data.fetchFollowing;
  const searchPlaceholder = intl.formatMessage(messages.search);

  return (
    <div>
      <h2>
        <F defaultMessage="following" />
      </h2>

      <ul>
        <FollowingSpecialFeeds handleSetFeed={handleSetFeed} specialFeed={specialFeed} pollInterval={POLL_INTERVAL} />
        <FollowingFeeds
          following={following as UserRemotePublic[]}
          handleSetFeed={handleSetFeed}
          currentUserRemote={userRemote}
          pollInterval={POLL_INTERVAL}
        />
      </ul>

      <NewFeed handleSetFeed={handleSetFeed} />

      <input
        type="search"
        onKeyUp={handleSearchKeyUp}
        onChange={handleSearchChange}
        ref={searchInput}
        placeholder={searchPlaceholder}
      />
    </div>
  );
}
