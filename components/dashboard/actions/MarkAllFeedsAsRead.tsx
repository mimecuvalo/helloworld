import { gql, useMutation } from '@apollo/client';

import { F } from 'i18n';
import FollowingFeedCountsQuery from 'components/dashboard/FollowingFeedCountsQuery';
import FollowingSpecialFeedCountsQuery from 'components/dashboard/FollowingSpecialFeedCountsQuery';
import { MenuItem } from 'components';
import { escapeRegExp } from 'util/regex';
import { prefixIdFromObject } from 'data/apollo';

const MARK_ALL_FEEDS_AS_READ = gql`
  mutation markAllFeedsAsRead {
    markAllFeedsAsRead {
      count
    }
  }
`;

export default function MarkAllFeedsAsRead({ handleClose }: { handleClose: () => void }) {
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
      <F defaultMessage="mark all feeds as read" />
    </MenuItem>
  );
}
