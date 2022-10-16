import { ContentRemote, FavoriteContentRemoteMutation } from 'data/graphql-generated';
import { gql, useMutation } from '@apollo/client';

import { Button } from 'components';
import { F } from 'i18n';
import FollowingSpecialFeedCountsQuery from 'components/dashboard/FollowingSpecialFeedCountsQuery';

const FAVORITE_CONTENT_REMOTE = gql`
  mutation favoriteContentRemote($fromUsername: String!, $postId: String!, $type: String!, $favorited: Boolean!) {
    favoriteContentRemote(fromUsername: $fromUsername, postId: $postId, type: $type, favorited: $favorited) {
      favorited
      fromUsername
      postId
      type
    }
  }
`;

export default function Favorite({
  contentRemote,
  isDashboard,
}: {
  contentRemote: ContentRemote;
  isDashboard?: boolean;
}) {
  const { favorited, fromUsername, postId, type } = contentRemote;
  const variables = { fromUsername, postId, type, favorited: !favorited };

  const [favoriteContentRemote] = useMutation<FavoriteContentRemoteMutation>(FAVORITE_CONTENT_REMOTE);

  const handleClick = () =>
    favoriteContentRemote({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        // @ts-ignore
        favoriteContentRemote: Object.assign({ __typename: type }, variables),
      },
      update: (store) => {
        if (isDashboard) {
          const query = FollowingSpecialFeedCountsQuery;
          const data: any = store.readQuery({ query });
          data.fetchUserTotalCounts.favoritesCount += variables.favorited ? 1 : -1;
          store.writeQuery({ query, data });
        }
      },
    });

  return (
    <Button
      onClick={handleClick}
      className="hw-button-link"
      sx={{ fontWeight: contentRemote.favorited ? 'bold' : 'normal' }}
    >
      <F defaultMessage="favorite" />
    </Button>
  );
}
