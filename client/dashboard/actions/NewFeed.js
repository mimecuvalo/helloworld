import { defineMessages, injectIntl } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
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
    // Note: we do setTimeout b/c the <input /> field's value isn't set quite yet upon paste.
    const inputField = evt.target;
    const func = async () => {
      try {
        await this.props.mutate({
          variables: { profile_url: inputField.value },
          // optimisticResponse: {
          //   __typename: 'Mutation',
          //   favoriteContentRemote: Object.assign({}, variables, { __typename: 'ContentRemote' }),
          // },
          // update: (store, { data: { favoriteContentRemote } }) => {
          //   const query = gql`
          //     {
          //       fetchUserTotalCounts {
          //         favoritesCount
          //       }
          //     }
          //   `;
          //   const data = store.readQuery({ query });
          //   data.fetchUserTotalCounts.favoritesCount += variables.favorited ? 1 : -1;
          //   store.writeQuery({ query: query, data });
          // },
        });
      } catch (ex) {
        this.props.enqueueSnackbar(this.props.intl.formatMessage(messages.error), { variant: 'error' });
      }
    };

    setTimeout(func, 0);
  };

  render() {
    const followPlaceholder = this.props.intl.formatMessage(messages.follow);

    return <input className={styles.newFeed} placeholder={followPlaceholder} onPaste={this.handleNewFeedPaste} />;
  }
}

export default withSnackbar(injectIntl(NewFeed));
