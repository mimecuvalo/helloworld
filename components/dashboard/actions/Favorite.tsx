import { ContentRemote, FavoriteContentRemoteMutation } from 'data/graphql-generated';
import { gql, useMutation } from '@apollo/client';

import { Button } from 'components';
import FollowingSpecialFeedCountsQuery from 'components/dashboard/FollowingSpecialFeedCountsQuery';
import { FavoriteBorderOutlined, FavoriteOutlined } from '@mui/icons-material';
import { defineMessages, useIntl } from '@/i18n';

const messages = defineMessages({
  favorite: { defaultMessage: 'Favorite' },
});

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
  const intl = useIntl();
  const { favorited, fromUsername, postId, type } = contentRemote;
  const variables = { fromUsername: fromUsername || '', postId, type, favorited: !favorited };

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
      sx={{ fontWeight: contentRemote.favorited ? 'bold' : 'normal' }}
      title={intl.formatMessage(messages.favorite)}
    >
      {contentRemote.favorited ? <FavoriteOutlined /> : <FavoriteBorderOutlined />}
    </Button>
  );
}
