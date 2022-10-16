import { gql, useMutation } from '@apollo/client';

import { F } from 'i18n';
import MenuItem from '@mui/material/MenuItem';
import { UserRemotePublic } from 'data/graphql-generated';

const TOGGLE_SORT_FEED = gql`
  mutation toggleSortFeed($profileUrl: String!, $currentSortType: String!) {
    toggleSortFeed(profileUrl: $profileUrl, currentSortType: $currentSortType) {
      profileUrl
      sortType
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
  userRemote: UserRemotePublic;
}) {
  const [toggleSortFeed] = useMutation(TOGGLE_SORT_FEED);

  const handleClick = async () => {
    handleClose();

    const mutationResult = await toggleSortFeed({
      variables: { profileUrl: userRemote.profileUrl, currentSortType: userRemote.sortType },
    });

    handleSetFeed(Object.assign({}, userRemote, mutationResult.data.toggleSortFeed));
  };

  return (
    <MenuItem onClick={handleClick}>
      {userRemote.sortType === 'oldest' ? <F defaultMessage="sort by newest" /> : <F defaultMessage="sort by oldest" />}
    </MenuItem>
  );
}
