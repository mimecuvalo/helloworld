import { escapeRegExp } from '../../../shared/util/regex';
import { F } from '../../../shared/i18n';
import FollowingFeedCountsQuery from '../FollowingFeedCountsQuery';
import FollowingSpecialFeedCountsQuery from '../FollowingSpecialFeedCountsQuery';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import MenuItem from '@material-ui/core/MenuItem';
import { prefixIdFromObject } from '../../../shared/data/apollo';
import React, { PureComponent } from 'react';

@graphql(gql`
  mutation markAllFeedsAsRead {
    markAllFeedsAsRead {
      count
    }
  }
`)
class MarkAllFeedsAsRead extends PureComponent {
  handleClick = async () => {
    this.props.handleClose();

    await this.props.mutate({
      variables: {},
      optimisticResponse: {
        __typename: 'Mutation',
        markAllFeedsAsRead: { __typename: 'UserCounts', count: 0 },
      },
      refetchQueries: [{ query: FollowingSpecialFeedCountsQuery }, { query: FollowingFeedCountsQuery }],
      update: (store, { data: { markAllFeedsAsRead } }) => {
        const prefixId = escapeRegExp(prefixIdFromObject({ __typename: 'Post' }));
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
        <F msg="mark all feeds as read" />
      </MenuItem>
    );
  }
}

export default MarkAllFeedsAsRead;
