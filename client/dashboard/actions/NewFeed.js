import classNames from 'classnames';
import { defineMessages, useIntl } from 'react-intl-wrapper';
import { F } from 'react-intl-wrapper';
import gql from 'graphql-tag';
import FollowingFeedCountsQuery from 'client/dashboard/FollowingFeedCountsQuery';
import FollowingQuery from 'client/dashboard/FollowingQuery';
import FollowingSpecialFeedCountsQuery from 'client/dashboard/FollowingSpecialFeedCountsQuery';
import MenuItem from '@material-ui/core/MenuItem';
import { useMutation } from '@apollo/client';
import { useSnackbar } from 'notistack';
import useStyles from './actionsStyles';

const messages = defineMessages({
  error: { msg: 'Error subscribing to new feed.' },
  follow: { msg: 'paste url to follow' },
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

export default function NewFeed(props) {
  const snackbar = useSnackbar();
  const intl = useIntl();
  const [createUserRemote] = useMutation(CREATE_USER_REMOTE);
  const styles = useStyles();

  // when NewFeed is used as an input field.
  const handleNewFeedPaste = (evt) => {
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
  const handleClick = (evt) => {
    addNewFeed(props.profileUrl);
  };

  async function addNewFeed(profile_url) {
    try {
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
      props.handleSetFeed(data.createUserRemote);
    } catch (ex) {
      snackbar.enqueueSnackbar(intl.formatMessage(messages.error), { variant: 'error' });
    }
  }

  const followPlaceholder = intl.formatMessage(messages.follow);

  if (props.isButton) {
    return (
      <MenuItem onClick={handleClick}>
        <F msg="follow back" />
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
