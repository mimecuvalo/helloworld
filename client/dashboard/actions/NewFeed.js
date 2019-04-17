import { defineMessages, injectIntl } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import FollowingFeedCountsQuery from '../FollowingFeedCountsQuery';
import FollowingQuery from '../FollowingQuery';
import FollowingSpecialFeedCountsQuery from '../FollowingSpecialFeedCountsQuery';
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
  handleNewFeedPaste = evt => {
    const inputField = evt.target;

    const func = async () => {
      try {
        const profile_url = inputField.value;
        inputField.value = '';
        inputField.blur();

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
    };

    // Note: we do setTimeout b/c the <input /> field's value isn't set quite yet upon paste.
    setTimeout(func, 0);
  };

  render() {
    const followPlaceholder = this.props.intl.formatMessage(messages.follow);

    return <input className={styles.newFeed} placeholder={followPlaceholder} onPaste={this.handleNewFeedPaste} />;
  }
}

export default NewFeed;
