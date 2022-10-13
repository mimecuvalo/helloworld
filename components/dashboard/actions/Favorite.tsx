import { gql, useMutation } from '@apollo/client';

import { F } from 'i18n';
import FollowingSpecialFeedCountsQuery from 'components/dashboard/FollowingSpecialFeedCountsQuery';
import classNames from 'classnames';

const FAVORITE_CONTENT_REMOTE = gql`
  mutation favoriteContentRemote($from_user: String, $post_id: String!, $type: String!, $favorited: Boolean!) {
    favoriteContentRemote(from_user: $from_user, post_id: $post_id, type: $type, favorited: $favorited) {
      favorited
      from_user
      post_id
      type
    }
  }
`;

export default function Favorite({
  contentRemote,
  isDashboard,
}: {
  contentRemote: ContentRemote;
  isDashboard: boolean;
}) {
  const { favorited, from_user, post_id, type } = contentRemote;
  const variables = { from_user, post_id, type, favorited: !favorited };

  const [favoriteContentRemote] = useMutation(FAVORITE_CONTENT_REMOTE);

  const handleClick = (evt) =>
    favoriteContentRemote({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        favoriteContentRemote: Object.assign({}, variables, { __typename: type }),
      },
      update: (store, { data: { favoriteContentRemote } }) => {
        if (isDashboard) {
          const query = FollowingSpecialFeedCountsQuery;
          const data = store.readQuery({ query });
          data.fetchUserTotalCounts.favoritesCount += variables.favorited ? 1 : -1;
          store.writeQuery({ query, data });
        }
      },
    });

  return (
    <button
      onClick={handleClick}
      className={classNames('hw-button-link', { [styles.enabled]: contentRemote.favorited })}
    >
      <F defaultMessage="favorite" />
    </button>
  );
}
