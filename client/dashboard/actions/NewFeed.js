import { defineMessages, injectIntl } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import FollowingQuery from '../FollowingQuery';
import FollowingFeedsQuery from '../FollowingFeedsQuery';
import React, { PureComponent } from 'react';
import styles from './Actions.module.css';
import { withSnackbar } from 'notistack';

const messages = defineMessages({
  error: { msg: 'Error subscribing to new feed.' },
  follow: { msg: 'paste url to follow' },
});

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
          refetchQueries: [{ query: FollowingQuery }, { query: FollowingFeedsQuery }],
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

export default withSnackbar(injectIntl(NewFeed));
