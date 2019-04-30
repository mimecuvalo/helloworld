import { escapeRegExp } from '../../../shared/util/regex';
import { F } from '../../../shared/i18n';
import FollowingSpecialFeedCountsQuery from '../FollowingSpecialFeedCountsQuery';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import MenuItem from '@material-ui/core/MenuItem';
import { prefixIdFromObject } from '../../../shared/data/apollo';
import React, { PureComponent } from 'react';

@graphql(gql`
  mutation markAllContentInFeedAsRead($from_user: String!) {
    markAllContentInFeedAsRead(from_user: $from_user) {
      from_user
      count
    }
  }
`)
class MarkAllAsRead extends PureComponent {
  handleClick = async () => {
    this.props.handleClose();

    const from_user = this.props.userRemote.profile_url;
    await this.props.mutate({
      variables: { from_user },
      optimisticResponse: {
        __typename: 'Mutation',
        markAllContentInFeedAsRead: { __typename: 'FeedCount', from_user, count: 0 },
      },
      refetchQueries: [{ query: FollowingSpecialFeedCountsQuery }],
      update: (store, { data: { markAllContentInFeedAsRead } }) => {
        const prefixId = escapeRegExp(prefixIdFromObject({ __typename: 'Post', from_user }));
        const regex = new RegExp(`^${prefixId}`);
        Object.keys(store.data.data).forEach(
          key => key.match(regex) && store.data.set(key, Object.assign({}, store.data.get(key), { read: true }))
        );
      },
    });
  };

  render() {
    return (
      <MenuItem onClick={this.handleClick}>
        <F msg="mark all as read" />
      </MenuItem>
    );
  }
}

export default MarkAllAsRead;
