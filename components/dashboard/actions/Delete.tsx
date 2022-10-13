import { gql, useMutation } from '@apollo/client';

import { F } from 'i18n';
import { MouseEvent } from 'react';

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

export default function Delete({ contentRemote }: { contentRemote: ContentRemote }) {
  const { deleted, from_user, local_content_name, post_id, type } = contentRemote;
  const variables = { from_user, local_content_name, post_id, type, deleted: !deleted };

  const [deleteContentRemote] = useMutation(DELETE_CONTENT_REMOTE);

  const handleClick = (evt: MouseEvent) =>
    deleteContentRemote({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        deleteContentRemote: Object.assign({}, variables, { __typename: type }),
      },
    });

  return (
    <button onClick={handleClick} disabled={!contentRemote.deleted} className="hw-button-link">
      <F defaultMessage="delete" />
    </button>
  );
}
