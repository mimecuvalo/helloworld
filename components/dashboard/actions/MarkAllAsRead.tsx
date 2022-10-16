import { MarkAllContentInFeedAsReadMutation, UserRemotePublic } from 'data/graphql-generated';
import { gql, useMutation } from '@apollo/client';

import { F } from 'i18n';
import FollowingSpecialFeedCountsQuery from 'components/dashboard/FollowingSpecialFeedCountsQuery';
import { MenuItem } from 'components';
import { escapeRegExp } from 'util/regex';
import { prefixIdFromObject } from 'data/localState';

const MARK_ALL_CONTENT_IN_FEED_AS_READ = gql`
  mutation markAllContentInFeedAsRead($fromUsername: String!) {
    markAllContentInFeedAsRead(fromUsername: $fromUsername) {
      fromUsername
      count
    }
  }
`;

export default function MarkAllAsRead({
  handleClose,
  userRemote,
}: {
  handleClose: () => void;
  userRemote: UserRemotePublic;
}) {
  const [markAllContentInFeedAsRead] = useMutation<MarkAllContentInFeedAsReadMutation>(
    MARK_ALL_CONTENT_IN_FEED_AS_READ
  );
  const fromUsername = userRemote.profileUrl;

  const handleClick = () => {
    handleClose();

    markAllContentInFeedAsRead({
      variables: { fromUsername },
      optimisticResponse: {
        __typename: 'Mutation',
        markAllContentInFeedAsRead: { __typename: 'FeedCount', fromUsername, count: 0 },
      },
      refetchQueries: [{ query: FollowingSpecialFeedCountsQuery }],
      update: (store) => {
        const prefixId = escapeRegExp(prefixIdFromObject({ __typename: 'Post', fromUsername }));
        const regex = new RegExp(`^${prefixId}`);
        Object.keys((store as any).data.data).forEach(
          (key) =>
            key.match(regex) &&
            (store as any).data.set(key, Object.assign({}, (store as any).data.get(key), { read: true }))
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
