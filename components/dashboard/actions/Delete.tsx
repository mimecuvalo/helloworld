import { gql, useMutation } from '@apollo/client';

import { Button } from 'components';
import { ContentRemote } from 'data/graphql-generated';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { defineMessages, useIntl } from '@/i18n';

const messages = defineMessages({
  delete: { defaultMessage: 'Delete' },
});

const DELETE_CONTENT_REMOTE = gql`
  mutation deleteContentRemote(
    $fromUsername: String!
    $localContentName: String!
    $postId: String!
    $type: String!
    $deleted: Boolean!
  ) {
    deleteContentRemote(
      fromUsername: $fromUsername
      localContentName: $localContentName
      postId: $postId
      type: $type
      deleted: $deleted
    ) {
      deleted
      fromUsername
      localContentName
      postId
      type
    }
  }
`;

export default function Delete({ contentRemote }: { contentRemote: ContentRemote }) {
  const intl = useIntl();
  const { deleted, fromUsername, localContentName, postId, type } = contentRemote;
  const variables = { fromUsername, localContentName, postId, type, deleted: !deleted };

  const [deleteContentRemote] = useMutation(DELETE_CONTENT_REMOTE);

  const handleClick = () =>
    deleteContentRemote({
      variables,
      optimisticResponse: {
        __typename: 'Mutation',
        deleteContentRemote: Object.assign({}, variables, { __typename: type }),
      },
    });

  return (
    <Button onClick={handleClick} color="error" title={intl.formatMessage(messages.delete)}>
      {contentRemote.deleted ? <DeleteIcon /> : <DeleteOutlineIcon />}
    </Button>
  );
}
