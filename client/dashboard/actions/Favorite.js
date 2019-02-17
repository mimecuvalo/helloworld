import classNames from 'classnames';
import { F } from '../../../shared/i18n';
import FollowingSpecialFeedCountsQuery from '../FollowingSpecialFeedCountsQuery';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './Actions.module.css';

@graphql(gql`
  mutation favoriteContentRemote($from_user: String!, $post_id: String!, $favorited: Boolean!) {
    favoriteContentRemote(from_user: $from_user, post_id: $post_id, favorited: $favorited) {
      from_user
      post_id
      favorited
    }
  }
`)
class Favorite extends PureComponent {
  handleFavorite = async evt => {
    evt.preventDefault();

    const { favorited, from_user, post_id } = this.props.contentRemote;
    const variables = { from_user, post_id, favorited: !favorited };

    await this.props.mutate({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        favoriteContentRemote: Object.assign({}, variables, { __typename: 'ContentRemote' }),
      },
      update: (store, { data: { favoriteContentRemote } }) => {
        const query = FollowingSpecialFeedCountsQuery;
        const data = store.readQuery({ query });
        data.fetchUserTotalCounts.favoritesCount += variables.favorited ? 1 : -1;
        store.writeQuery({ query, data });
      },
    });
  };

  render() {
    return (
      <a
        href="#favorite"
        onClick={this.handleFavorite}
        className={classNames({ [styles.enabled]: this.props.contentRemote.favorited })}
      >
        <F msg="favorite" />
      </a>
    );
  }
}

export default Favorite;
