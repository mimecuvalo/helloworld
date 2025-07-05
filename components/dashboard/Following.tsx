import { F, defineMessages, useIntl } from 'i18n';
import { FetchFollowingQuery, UserRemotePublic } from 'data/graphql-generated';
import { KeyboardEvent, useRef } from 'react';
import { List, TextField, Typography, styled } from 'components';

import FollowingFeeds from './FollowingFeeds';
import FollowingQuery from './FollowingQuery';
import FollowingSpecialFeeds from './FollowingSpecialFeeds';
import NewFeed from './actions/NewFeed';
import { useQuery } from '@apollo/client';

const messages = defineMessages({
  search: { defaultMessage: 'search' },
});

const POLL_INTERVAL = 60 * 1000;

const Container = styled('div')`
  margin: 0 ${(props) => props.theme.spacing(2)} ${(props) => props.theme.spacing(3.5)} 0;
  padding: ${(props) => props.theme.spacing(1)};
  border: 1px solid ${(props) => props.theme.palette.success.main};
  box-shadow:
    1px 1px ${(props) => props.theme.palette.success.main},
    2px 2px ${(props) => props.theme.palette.success.main},
    3px 3px ${(props) => props.theme.palette.success.main};

  h2 {
    margin: 0;
  }
`;

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
    <Container>
      <Typography variant="h2">
        <F defaultMessage="following" />
      </Typography>

      <List>
        <FollowingSpecialFeeds handleSetFeed={handleSetFeed} specialFeed={specialFeed} pollInterval={POLL_INTERVAL} />
        <FollowingFeeds
          following={following as UserRemotePublic[]}
          handleSetFeed={handleSetFeed}
          currentUserRemote={userRemote}
          pollInterval={POLL_INTERVAL}
        />
      </List>

      <NewFeed handleSetFeed={handleSetFeed} />

      <search>
        <TextField
          size="small"
          margin="dense"
          type="search"
          onKeyUp={handleSearchKeyUp}
          onChange={handleSearchChange}
          ref={searchInput}
          placeholder={searchPlaceholder}
          className="notranslate"
        />
      </search>
    </Container>
  );
}
