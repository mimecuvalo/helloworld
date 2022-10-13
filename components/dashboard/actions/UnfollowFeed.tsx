import { gql, useMutation } from '@apollo/client';

import { F } from 'i18n';
import FollowingQuery from 'components/dashboard/FollowingQuery';
import FollowingSpecialFeedCountsQuery from 'components/dashboard/FollowingSpecialFeedCountsQuery';
import MenuItem from '@mui/material/MenuItem';

const DESTROY_FEED = gql`
  mutation destroyFeed($profile_url: String!) {
    destroyFeed(profile_url: $profile_url)
  }
`;

export default function UnfollowFeed({
  handleClose,
  handleSetFeed,
  userRemote,
}: {
  handleClose: () => void;
  handleSetFeed: (userRemote: string, query?: any, allItems?: boolean) => void;
  userRemote: User;
}) {
  const profile_url = userRemote.profile_url;

  const [destroyFeed] = useMutation(DESTROY_FEED);

  const handleClick = async () => {
    handleClose();

    await destroyFeed({
      variables: { profile_url },
      refetchQueries: [{ query: FollowingSpecialFeedCountsQuery }],
      update: (store, { data }) => {
        const followingData = store.readQuery({ query: FollowingQuery });
        store.writeQuery({
          query: FollowingQuery,
          data: {
            fetchFollowing: followingData.fetchFollowing.filter((i) => i.profile_url !== profile_url),
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
