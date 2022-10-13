import { gql, useMutation } from '@apollo/client';

import { F } from 'i18n';
import MenuItem from '@mui/material/MenuItem';

const TOGGLE_SORT_FEED = gql`
  mutation toggleSortFeed($profile_url: String!, $current_sort_type: String!) {
    toggleSortFeed(profile_url: $profile_url, current_sort_type: $current_sort_type) {
      profile_url
      sort_type
    }
  }
`;

export default function Sort({
  handleClose,
  handleSetFeed,
  userRemote,
}: {
  handleClose: () => void;
  handleSetFeed: (userRemote: string, query?: any, allItems?: boolean) => void;
  userRemote: User;
}) {
  const [toggleSortFeed] = useMutation(TOGGLE_SORT_FEED);

  const handleClick = async () => {
    handleClose();

    const mutationResult = await toggleSortFeed({
      variables: { profile_url: userRemote.profile_url, current_sort_type: userRemote.sort_type },
    });

    handleSetFeed(Object.assign({}, userRemote, mutationResult.data.toggleSortFeed));
  };

  return (
    <MenuItem onClick={handleClick}>
      {userRemote.sort_type === 'oldest' ? (
        <F defaultMessage="sort by newest" />
      ) : (
        <F defaultMessage="sort by oldest" />
      )}
    </MenuItem>
  );
}
