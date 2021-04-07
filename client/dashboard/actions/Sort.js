import { F } from 'react-intl-wrapper';
import MenuItem from '@material-ui/core/MenuItem';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/client';

const TOGGLE_SORT_FEED = gql`
  mutation toggleSortFeed($profile_url: String!, $current_sort_type: String!) {
    toggleSortFeed(profile_url: $profile_url, current_sort_type: $current_sort_type) {
      profile_url
      sort_type
    }
  }
`;

export default function Sort(props) {
  const [toggleSortFeed] = useMutation(TOGGLE_SORT_FEED);

  const handleClick = async () => {
    props.handleClose();

    const mutationResult = await toggleSortFeed({
      variables: { profile_url: props.userRemote.profile_url, current_sort_type: props.userRemote.sort_type },
    });

    props.handleSetFeed(Object.assign({}, props.userRemote, mutationResult.data.toggleSortFeed));
  };

  return (
    <MenuItem onClick={handleClick}>
      {props.userRemote.sort_type === 'oldest' ? <F msg="sort by newest" /> : <F msg="sort by oldest" />}
    </MenuItem>
  );
}
