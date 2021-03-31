import classNames from 'classnames';
import { defineMessages, F, useIntl } from 'react-intl-wrapper';
import FollowingFeeds from './FollowingFeeds';
import FollowingQuery from './FollowingQuery';
import FollowingSpecialFeeds from './FollowingSpecialFeeds';
import NewFeed from './actions/NewFeed';
import React, { useRef } from 'react';
import { useQuery } from '@apollo/client';
import useStyles from './remoteUsersStyles';

const messages = defineMessages({
  search: { msg: 'search' },
});

const POLL_INTERVAL = 60 * 1000;

export default function Following(props) {
  const intl = useIntl();
  const searchInput = useRef(null);
  const { loading, data } = useQuery(FollowingQuery);
  const styles = useStyles();

  if (loading) {
    return null;
  }

  const handleSearchKeyUp = evt => {
    if (evt.key === 'Enter') {
      props.handleSetFeed('', searchInput.current.value);
    }
  };

  // It'd be nice to listen to the 'search' event for the (x) cancel button but it doesn't work w/ React?
  const handleSearchChange = evt => {
    if (!searchInput.current.value) {
      props.handleSetFeed('', searchInput.current.value);
    }
  };

  const following = data.fetchFollowing;
  const { className, handleSetFeed, userRemote, specialFeed } = props;
  const searchPlaceholder = intl.formatMessage(messages.search);

  return (
    <div className={classNames(className, styles.remoteUsers)}>
      <h2>
        <F msg="following" />
      </h2>

      <ul>
        <FollowingSpecialFeeds handleSetFeed={handleSetFeed} specialFeed={specialFeed} pollInterval={POLL_INTERVAL} />
        <FollowingFeeds
          following={following}
          handleSetFeed={handleSetFeed}
          currentUserRemote={userRemote}
          pollInterval={POLL_INTERVAL}
        />
      </ul>

      <NewFeed handleSetFeed={handleSetFeed} />

      <input
        className={classNames(styles.search, 'notranslate')}
        type="search"
        onKeyUp={handleSearchKeyUp}
        onChange={handleSearchChange}
        ref={searchInput}
        placeholder={searchPlaceholder}
      />
    </div>
  );
}
