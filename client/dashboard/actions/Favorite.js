import classNames from 'classnames';
import { F } from '../../../shared/i18n';
import FollowingSpecialFeedCountsQuery from '../FollowingSpecialFeedCountsQuery';
import gql from 'graphql-tag';
import React from 'react';
import { useMutation } from '@apollo/react-hooks';
import useStyles from './actionsStyles';

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

export default function Favorite(props) {
  const { favorited, from_user, post_id, type } = props.contentRemote;
  const variables = { from_user, post_id, type, favorited: !favorited };

  const [favoriteContentRemote] = useMutation(FAVORITE_CONTENT_REMOTE);
  const styles = useStyles();

  const handleClick = evt =>
    favoriteContentRemote({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        favoriteContentRemote: Object.assign({}, variables, { __typename: type }),
      },
      update: (store, { data: { favoriteContentRemote } }) => {
        if (props.isDashboard) {
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
      className={classNames('hw-button-link', { [styles.enabled]: props.contentRemote.favorited })}
    >
      <F msg="favorite" />
    </button>
  );
}
