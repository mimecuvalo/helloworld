import { F } from '../../../shared/i18n';
import FollowingQuery from '../FollowingQuery';
import FollowingSpecialFeedCountsQuery from '../FollowingSpecialFeedCountsQuery';
import gql from 'graphql-tag';
import MenuItem from '@material-ui/core/MenuItem';
import React from 'react';
import { useMutation } from '@apollo/react-hooks';

const DESTROY_FEED = gql`
  mutation destroyFeed($profile_url: String!) {
    destroyFeed(profile_url: $profile_url)
  }
`;

export default function UnfollowFeed(props) {
  const profile_url = props.userRemote.profile_url;

  const [destroyFeed] = useMutation(DESTROY_FEED);

  const handleClick = async () => {
    props.handleClose();

    await destroyFeed({
      variables: { profile_url },
      refetchQueries: [{ query: FollowingSpecialFeedCountsQuery }],
      update: (store, { data }) => {
        const followingData = store.readQuery({ query: FollowingQuery });
        store.writeQuery({
          query: FollowingQuery,
          data: {
            fetchFollowing: followingData.fetchFollowing.filter(i => i.profile_url !== profile_url),
          },
        });
      },
    });
    props.handleSetFeed('');
  };

  return (
    <MenuItem onClick={handleClick}>
      <F msg="unfollow" />
    </MenuItem>
  );
}
