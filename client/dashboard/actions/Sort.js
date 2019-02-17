import { F } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import MenuItem from '@material-ui/core/MenuItem';
import React, { PureComponent } from 'react';

@graphql(gql`
  mutation toggleSortFeed($profile_url: String!, $current_sort_type: String!) {
    toggleSortFeed(profile_url: $profile_url, current_sort_type: $current_sort_type) {
      profile_url
      sort_type
    }
  }
`)
class Sort extends PureComponent {
  handleClick = async () => {
    this.props.handleClose();

    const mutationResult = await this.props.mutate({
      variables: { profile_url: this.props.userRemote.profile_url, current_sort_type: this.props.userRemote.sort_type },
    });

    this.props.handleSetFeed(Object.assign({}, this.props.userRemote, mutationResult.data.toggleSortFeed));
  };

  render() {
    return (
      <MenuItem onClick={this.handleClick}>
        {this.props.userRemote.sort_type === 'oldest' ? <F msg="sort by newest" /> : <F msg="sort by oldest" />}
      </MenuItem>
    );
  }
}

export default Sort;
