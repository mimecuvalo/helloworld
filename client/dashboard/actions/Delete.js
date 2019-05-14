import classNames from 'classnames';
import { F } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './Actions.module.css';

@graphql(gql`
  mutation deleteContentRemote(
    $from_user: String
    $local_content_name: String!
    $post_id: String!
    $type: String!
    $deleted: Boolean!
  ) {
    deleteContentRemote(
      from_user: $from_user
      local_content_name: $local_content_name
      post_id: $post_id
      type: $type
      deleted: $deleted
    ) {
      deleted
      from_user
      local_content_name
      post_id
      type
    }
  }
`)
class Delete extends PureComponent {
  handleClick = async evt => {
    const { deleted, from_user, local_content_name, post_id, type } = this.props.contentRemote;
    const variables = { from_user, local_content_name, post_id, type, deleted: !deleted };

    await this.props.mutate({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        deleteContentRemote: Object.assign({}, variables, { __typename: type }),
      },
    });
  };

  render() {
    return (
      <button
        onClick={this.handleClick}
        className={classNames('hw-button-link', { [styles.enabled]: this.props.contentRemote.deleted })}
      >
        <F msg="delete" />
      </button>
    );
  }
}

export default Delete;
