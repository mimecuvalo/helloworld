import { MenuItem, TextField } from 'components';
import { defineMessages, useIntl } from 'i18n';
import { gql, useMutation } from '@apollo/client';

import { ClipboardEvent } from 'react';
import { F } from 'i18n';
import FollowingFeedCountsQuery from 'components/dashboard/FollowingFeedCountsQuery';
import FollowingQuery from 'components/dashboard/FollowingQuery';
import FollowingSpecialFeedCountsQuery from 'components/dashboard/FollowingSpecialFeedCountsQuery';
import { UserRemotePublic } from 'data/graphql-generated';
import { useTheme } from '@mui/material';

const messages = defineMessages({
  error: { defaultMessage: 'Error subscribing to new feed.' },
  follow: { defaultMessage: 'paste url to follow' },
});

const CREATE_USER_REMOTE = gql`
  mutation createUserRemote($profileUrl: String!) {
    createUserRemote(profileUrl: $profileUrl) {
      avatar
      favicon
      name
      profileUrl
      sortType
      username
    }
  }
`;

export default function NewFeed({
  profileUrl,
  isButton,
  handleSetFeed,
}: {
  profileUrl?: string;
  isButton?: boolean;
  handleSetFeed: (feed: UserRemotePublic | string, search?: string) => void;
}) {
  const intl = useIntl();
  const theme = useTheme();
  const [createUserRemote] = useMutation(CREATE_USER_REMOTE);

  // when NewFeed is used as an input field.
  const handleNewFeedPaste = (evt: ClipboardEvent) => {
    const inputField = evt.target as HTMLInputElement;

    const func = () => {
      const profileUrl = inputField.value;
      inputField.value = '';
      inputField.blur();

      addNewFeed(profileUrl);
    };

    // Note: we do setTimeout b/c the <input /> field's value isn't set quite yet upon paste.
    setTimeout(func, 0);
  };

  // when NewFeed is used as a button.
  const handleClick = () => {
    addNewFeed(profileUrl || '');
  };

  async function addNewFeed(profileUrl: string) {
    const { data } = await createUserRemote({
      variables: { profileUrl },
      refetchQueries: [{ query: FollowingSpecialFeedCountsQuery }, { query: FollowingFeedCountsQuery }],
      update: (store, { data: { createUserRemote } }) => {
        const data: any = store.readQuery({ query: FollowingQuery });
        store.writeQuery({
          query: FollowingQuery,
          data: { fetchFollowing: [...data.fetchFollowing, createUserRemote] },
        });
      },
    });
    handleSetFeed(data.createUserRemote);
  }

  const followPlaceholder = intl.formatMessage(messages.follow);

  if (isButton) {
    return (
      <MenuItem onClick={handleClick}>
        <F defaultMessage="follow back" />
      </MenuItem>
    );
  }

  return (
    <TextField
      size="small"
      margin="dense"
      className="notranslate"
      placeholder={followPlaceholder}
      onPaste={handleNewFeedPaste}
      color="primary"
      InputProps={{ sx: { color: theme.palette.text.primary } }}
    />
  );
}
