import classNames from 'classnames';
import { F } from '../../../shared/i18n';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { PureComponent } from 'react';
import styles from './Actions.module.css';

@graphql(gql`
  mutation deleteContentRemote($from_user: String, $post_id: String!, $type: String!, $deleted: Boolean!) {
    deleteContentRemote(from_user: $from_user, post_id: $post_id, type: $type, deleted: $deleted) {
      deleted
      from_user
      post_id
      type
    }
  }
`)
class Delete extends PureComponent {
  handleClick = async evt => {
    evt.preventDefault();

    const { deleted, from_user, post_id, type } = this.props.contentRemote;
    const variables = { from_user, post_id, type, deleted: !deleted };

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
      <a
        href="#delete"
        onClick={this.handleClick}
        className={classNames({ [styles.enabled]: this.props.contentRemote.deleted })}
      >
        <F msg="delete" />
      </a>
    );
  }
}

export default Delete;
