import { defineMessages, injectIntl } from '../../../shared/i18n';
import { F } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import FollowingFeedCountsQuery from '../FollowingFeedCountsQuery';
import FollowingQuery from '../FollowingQuery';
import FollowingSpecialFeedCountsQuery from '../FollowingSpecialFeedCountsQuery';
import MenuItem from '@material-ui/core/MenuItem';
import React, { PureComponent } from 'react';
import styles from './Actions.module.css';
import { withSnackbar } from 'notistack';

const messages = defineMessages({
  error: { msg: 'Error subscribing to new feed.' },
  follow: { msg: 'paste url to follow' },
});

@withSnackbar
@injectIntl
@graphql(gql`
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
`)
class NewFeed extends PureComponent {
  // when NewFeed is used as an input field.
  handleNewFeedPaste = evt => {
    const inputField = evt.target;

    const func = () => {
      const profile_url = inputField.value;
      inputField.value = '';
      inputField.blur();

      this.addNewFeed(profile_url);
    };

    // Note: we do setTimeout b/c the <input /> field's value isn't set quite yet upon paste.
    setTimeout(func, 0);
  };

  // when NewFeed is used as a button.
  handleClick = evt => {
    this.addNewFeed(this.props.profileUrl);
  };

  async addNewFeed(profile_url) {
    try {
      const mutationResult = await this.props.mutate({
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

      this.props.handleSetFeed(mutationResult.data.createUserRemote);
    } catch (ex) {
      this.props.enqueueSnackbar(this.props.intl.formatMessage(messages.error), { variant: 'error' });
    }
  }

  render() {
    const followPlaceholder = this.props.intl.formatMessage(messages.follow);

    if (this.props.isButton) {
      return (
        <MenuItem onClick={this.handleClick}>
          <F msg="follow back" />
        </MenuItem>
      );
    }

    return <input className={styles.newFeed} placeholder={followPlaceholder} onPaste={this.handleNewFeedPaste} />;
  }
}

export default NewFeed;
