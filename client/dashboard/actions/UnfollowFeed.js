import { F } from '../../../shared/i18n';
import FollowingQuery from '../FollowingQuery';
import FollowingSpecialFeedCountsQuery from '../FollowingSpecialFeedCountsQuery';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import MenuItem from '@material-ui/core/MenuItem';
import React, { PureComponent } from 'react';

@graphql(gql`
  mutation destroyFeed($profile_url: String!) {
    destroyFeed(profile_url: $profile_url)
  }
`)
class UnfollowFeed extends PureComponent {
  handleClick = async () => {
    this.props.handleClose();

    const profile_url = this.props.userRemote.profile_url;
    await this.props.mutate({
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

    this.props.handleSetFeed('');
  };

  render() {
    return (
      <MenuItem onClick={this.handleClick}>
        <F msg="unfollow" />
      </MenuItem>
    );
  }
}

export default UnfollowFeed;
