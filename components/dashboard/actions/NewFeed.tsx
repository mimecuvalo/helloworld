import { ClipboardEvent, MouseEvent } from 'react';
import { defineMessages, useIntl } from 'i18n';
import { gql, useMutation } from '@apollo/client';

import { F } from 'i18n';
import FollowingFeedCountsQuery from 'components/dashboard/FollowingFeedCountsQuery';
import FollowingQuery from 'components/dashboard/FollowingQuery';
import FollowingSpecialFeedCountsQuery from 'components/dashboard/FollowingSpecialFeedCountsQuery';
import { MenuItem } from 'components';
import classNames from 'classnames';

const messages = defineMessages({
  error: { defaultMessage: 'Error subscribing to new feed.' },
  follow: { defaultMessage: 'paste url to follow' },
});

const CREATE_USER_REMOTE = gql`
  mutation createUserRemote($profile_url: String!) {
    createUserRemote(profile_url: $profile_url) {
      avatar
      favicon
      name
      profile_url
      sort_type
      username
    }
  }
`;

export default function NewFeed({
  profileUrl,
  isButton,
  handleSetFeed,
}: {
  profileUrl: string;
  isButton: boolean;
  handleSetFeed: (feed: any) => void;
}) {
  const intl = useIntl();
  const [createUserRemote] = useMutation(CREATE_USER_REMOTE);

  // when NewFeed is used as an input field.
  const handleNewFeedPaste = (evt: ClipboardEvent) => {
    const inputField = evt.target;

    const func = () => {
      const profile_url = inputField.value;
      inputField.value = '';
      inputField.blur();

      addNewFeed(profile_url);
    };

    // Note: we do setTimeout b/c the <input /> field's value isn't set quite yet upon paste.
    setTimeout(func, 0);
  };

  // when NewFeed is used as a button.
  const handleClick = (evt: MouseEvent) => {
    addNewFeed(profileUrl);
  };

  async function addNewFeed(profile_url: string) {
    const { data } = await createUserRemote({
      variables: { profile_url },
      refetchQueries: [{ query: FollowingSpecialFeedCountsQuery }, { query: FollowingFeedCountsQuery }],
      update: (store, { data: { createUserRemote } }) => {
        const data = store.readQuery({ query: FollowingQuery });
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
    <input
      className={classNames(styles.newFeed, 'notranslate')}
      placeholder={followPlaceholder}
      onPaste={handleNewFeedPaste}
    />
  );
}
