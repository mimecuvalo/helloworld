import { escapeRegExp } from '../../../shared/util/regex';
import { F } from 'react-intl-wrapper';
import FollowingSpecialFeedCountsQuery from '../FollowingSpecialFeedCountsQuery';
import gql from 'graphql-tag';
import MenuItem from '@material-ui/core/MenuItem';
import { prefixIdFromObject } from '../../../shared/data/apollo';
import React from 'react';
import { useMutation } from '@apollo/react-hooks';

const MARK_ALL_CONTENT_IN_FEED_AS_READ = gql`
  mutation markAllContentInFeedAsRead($from_user: String!) {
    markAllContentInFeedAsRead(from_user: $from_user) {
      from_user
      count
    }
  }
`;

export default function MarkAllAsRead(props) {
  const [markAllContentInFeedAsRead] = useMutation(MARK_ALL_CONTENT_IN_FEED_AS_READ);
  const from_user = props.userRemote.profile_url;

  const handleClick = () => {
    props.handleClose();

    markAllContentInFeedAsRead({
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

  return (
    <MenuItem onClick={handleClick}>
      <F msg="mark all as read" />
    </MenuItem>
  );
}
