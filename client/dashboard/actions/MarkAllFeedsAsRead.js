import { F } from 'react-intl-wrapper';
import FollowingFeedCountsQuery from 'client/dashboard/FollowingFeedCountsQuery';
import FollowingSpecialFeedCountsQuery from 'client/dashboard/FollowingSpecialFeedCountsQuery';
import MenuItem from '@material-ui/core/MenuItem';
import { escapeRegExp } from 'shared/util/regex';
import gql from 'graphql-tag';
import { prefixIdFromObject } from 'shared/data/apollo';
import { useMutation } from '@apollo/client';

const MARK_ALL_FEEDS_AS_READ = gql`
  mutation markAllFeedsAsRead {
    markAllFeedsAsRead {
      count
    }
  }
`;

export default function MarkAllFeedsAsRead({ handleClose }) {
  const [markAllFeedsAsRead] = useMutation(MARK_ALL_FEEDS_AS_READ);

  const handleClick = () => {
    handleClose();
    markAllFeedsAsRead({
      optimisticResponse: {
        __typename: 'Mutation',
        markAllFeedsAsRead: { __typename: 'UserCounts', count: 0 },
      },
      refetchQueries: [{ query: FollowingSpecialFeedCountsQuery }, { query: FollowingFeedCountsQuery }],
      update: (store, { data: { markAllFeedsAsRead } }) => {
        const prefixId = escapeRegExp(prefixIdFromObject({ __typename: 'Post' }));
        const regex = new RegExp(`^${prefixId}`);
        Object.keys(store.data.data).forEach(
          (key) => key.match(regex) && store.data.set(key, Object.assign({}, store.data.get(key), { read: true }))
        );
      },
    });
  };

  return (
    <MenuItem onClick={handleClick}>
      <F msg="mark all feeds as read" />
    </MenuItem>
  );
}
