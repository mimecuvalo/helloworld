import classNames from 'classnames';
import { F } from '../../../shared/i18n';
import gql from 'graphql-tag';
import React from 'react';
import styles from './Actions.module.css';
import { useMutation } from '@apollo/react-hooks';

const DELETE_CONTENT_REMOTE = gql`
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
`;

export default function Delete(props) {
  const { deleted, from_user, local_content_name, post_id, type } = props.contentRemote;
  const variables = { from_user, local_content_name, post_id, type, deleted: !deleted };

  const [deleteContentRemote, result] = useMutation(DELETE_CONTENT_REMOTE);

  const handleClick = evt =>
    deleteContentRemote({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        deleteContentRemote: Object.assign({}, variables, { __typename: type }),
      },
    });

  return (
    <button
      onClick={handleClick}
      className={classNames('hw-button-link', { [styles.enabled]: props.contentRemote.deleted })}
    >
      <F msg="delete" />
    </button>
  );
}
