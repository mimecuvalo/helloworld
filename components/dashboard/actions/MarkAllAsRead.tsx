import { gql, useMutation } from '@apollo/client';

import { F } from 'i18n';
import FollowingSpecialFeedCountsQuery from 'components/dashboard/FollowingSpecialFeedCountsQuery';
import { MenuItem } from 'components';
import { escapeRegExp } from 'util/regex';
import { prefixIdFromObject } from 'data/apollo';

const MARK_ALL_CONTENT_IN_FEED_AS_READ = gql`
  mutation markAllContentInFeedAsRead($from_user: String!) {
    markAllContentInFeedAsRead(from_user: $from_user) {
      from_user
      count
    }
  }
`;

export default function MarkAllAsRead({
  handleClose,
  userRemote,
}: {
  handleClose: () => void;
  userRemote: UserRemote;
}) {
  const [markAllContentInFeedAsRead] = useMutation(MARK_ALL_CONTENT_IN_FEED_AS_READ);
  const from_user = userRemote.profile_url;

  const handleClick = () => {
    handleClose();

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
          (key) => key.match(regex) && store.data.set(key, Object.assign({}, store.data.get(key), { read: true }))
        );
      },
    });
  };

  return (
    <MenuItem onClick={handleClick}>
      <F defaultMessage="mark all as read" />
    </MenuItem>
  );
}
