import classNames from 'classnames';
import { F } from '../../../shared/i18n';
import FollowingSpecialFeedCountsQuery from '../FollowingSpecialFeedCountsQuery';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './Actions.module.css';

@graphql(gql`
  mutation favoriteContentRemote($from_user: String, $post_id: String!, $type: String!, $favorited: Boolean!) {
    favoriteContentRemote(from_user: $from_user, post_id: $post_id, type: $type, favorited: $favorited) {
      favorited
      from_user
      post_id
      type
    }
  }
`)
class Favorite extends PureComponent {
  handleClick = async evt => {
    evt.preventDefault();

    const { favorited, from_user, post_id, type } = this.props.contentRemote;
    const variables = { from_user, post_id, type, favorited: !favorited };

    await this.props.mutate({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        favoriteContentRemote: Object.assign({}, variables, { __typename: type }),
      },
      update: (store, { data: { favoriteContentRemote } }) => {
        if (this.props.isDashboard) {
          const query = FollowingSpecialFeedCountsQuery;
          const data = store.readQuery({ query });
          data.fetchUserTotalCounts.favoritesCount += variables.favorited ? 1 : -1;
          store.writeQuery({ query, data });
        }
      },
    });
  };

  render() {
    return (
      <a
        href="#favorite"
        onClick={this.handleClick}
        className={classNames({ [styles.enabled]: this.props.contentRemote.favorited })}
      >
        <F msg="favorite" />
      </a>
    );
  }
}

export default Favorite;
