import { gql, useMutation } from '@apollo/client';

import { F } from 'i18n';
import FollowingQuery from 'components/dashboard/FollowingQuery';
import FollowingSpecialFeedCountsQuery from 'components/dashboard/FollowingSpecialFeedCountsQuery';
import { MenuItem } from 'components';
import { UserRemotePublic } from 'data/graphql-generated';

const DESTROY_FEED = gql`
  mutation destroyFeed($profileUrl: String!) {
    destroyFeed(profileUrl: $profileUrl)
  }
`;

export default function UnfollowFeed({
  handleClose,
  handleSetFeed,
  userRemote,
}: {
  handleClose: () => void;
  handleSetFeed: (userRemote: UserRemotePublic | string, query?: any, allItems?: boolean) => void;
  userRemote: UserRemotePublic;
}) {
  const profileUrl = userRemote.profileUrl;

  const [destroyFeed] = useMutation(DESTROY_FEED);

  const handleClick = async () => {
    handleClose();

    await destroyFeed({
      variables: { profileUrl },
      refetchQueries: [{ query: FollowingSpecialFeedCountsQuery }],
      update: (store) => {
        const followingData: any = store.readQuery({ query: FollowingQuery });
        store.writeQuery({
          query: FollowingQuery,
          data: {
            fetchFollowing: followingData.fetchFollowing.filter((i: UserRemotePublic) => i.profileUrl !== profileUrl),
          },
        });
      },
    });
    handleSetFeed('');
  };

  return (
    <MenuItem onClick={handleClick}>
      <F defaultMessage="unfollow" />
    </MenuItem>
  );
}
