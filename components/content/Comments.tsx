import { Avatar, Link, List, ListItem, Typography, styled } from 'components';
import { Comment as CommentType, Content } from 'data/graphql-generated';
import { F, defineMessages, useIntl } from 'i18n';

import Delete from 'components/dashboard/actions/Delete';
import Favorite from 'components/dashboard/actions/Favorite';
import UserContext from '@/application/UserContext';
import { useContext } from 'react';

const Comment = styled(ListItem)`
  display: flex;
  margin-bottom: ${(props) => props.theme.spacing(1)};
  clear: both;
`;

const StyledComments = styled(List)`
  margin-top: ${(props) => props.theme.spacing(1)};
`;

const Author = styled('span')`
  font-weight: bold;
`;

const messages = defineMessages({
  avatar: { defaultMessage: 'avatar' },
  error: { defaultMessage: 'Error updating content.' },
});

// const POST_COMMENT = gql`
//   mutation postComment($username: String!, $name: String!, $content: String!) {
//     postComment(username: $username, name: $name, content: $content) {
//       avatar
//       content
//       deleted
//       favorited
//       fromUser
//       link
//       localContentName
//       postId
//       toUsername
//       type
//       username
//       view
//     }
//   }
// `;

export default function Comments({ comments, content }: { comments?: CommentType[]; content: Content }) {
  const intl = useIntl();
  // const commentEditor = useRef(null);
  // const [isPosting, setIsPosting] = useState(false);
  // const [postComment] = useMutation(POST_COMMENT);
  const { user } = useContext(UserContext);

  // const handleKeyDown = (evt: KeyboardEvent) => {
  //   if (!commentEditor || !commentEditor.current) {
  //     return;
  //   }

  //   // TODO(mime): combine this logic somewhere. (also in keyboard.js)
  //   const isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
  //   const isAccelKey = isMac ? evt.metaKey : evt.ctrlKey;
  //   if (isAccelKey && evt.key === 'Enter') {
  //     handlePost();
  //   }
  // };

  // useEffect(() => {
  //   document.addEventListener('keydown', handleKeyDown);

  //   return () => document.removeEventListener('keydown', handleKeyDown);
  // });

  // const handlePost = async () => {
  //   const { username, name } = content;
  //   const editor = commentEditor.current;
  //   const commentContent = JSON.stringify(editor.export());
  //   editor.clear();

  //   const variables = { username, name, content: commentContent };

  //   setIsPosting(true);

  //   try {
  //     await postComment({
  //       variables,
  //       update: (store, { data: { postComment } }) => {
  //         const contentVariables = { username, name };
  //         const query = ContentQuery;
  //         const data = store.readQuery({ query, variables: contentVariables });
  //         data.fetchCommentsRemote.unshift(postComment);
  //         store.writeQuery({ query, variables: contentVariables, data });
  //       },
  //     });
  //   } catch (ex) {
  //     snackbar.enqueueSnackbar(intl.formatMessage(messages.error), { variant: 'error' });
  //   }

  //   setIsPosting(false);
  // };

  const ariaImgMsg = intl.formatMessage(messages.avatar);
  const isOwnerViewing = user?.username === content.username;

  // let editor = null;
  // // TODO(mime): Suspense and lazy aren't supported by ReactDOMServer yet (breaks SSR).
  // if (isLoggedIn && typeof window !== 'undefined') {
  //   const Editor = lazy(() => import('hello-world-editor').then((module) => ({ default: module.Editor })));
  //   return (
  //     <Suspense fallback={<div />}>
  //       <Editor
  //         editorKey="comments"
  //         content={{}}
  //         ref={commentEditor}
  //         type="comment"
  //         dontWarnOnUnsaved={true}
  //         locale={configuration.locale}
  //       />
  //     </Suspense>
  //   );
  // }

  if (!comments?.length) {
    return null;
  }

  return (
    <div>
      <Typography variant="subtitle1">
        <F defaultMessage="comments" />
      </Typography>
      {/* {isLoggedIn ? (
        <CommentEditorWrapper>
          <Button disabled={isPosting} onClick={handlePost}>
            <F defaultMessage="post" />
          </Button>
        </CommentEditorWrapper>
      ) : (
        <Login />
      )} */}
      {comments ? (
        <StyledComments>
          {comments.map((comment) => (
            <Comment key={comment.postId}>
              <Avatar src={comment.avatar || '/img/pixel.gif'} alt={ariaImgMsg} sx={{ width: 16, height: 16 }} />
              <div>
                {comment.fromUsername ? (
                  <Link href={comment.fromUsername} target="_blank">
                    {comment.creator || comment.username}
                  </Link>
                ) : (
                  <Author>{comment.creator || comment.username}: </Author>
                )}
                <div dangerouslySetInnerHTML={{ __html: comment.view }} />

                {isOwnerViewing ? (
                  <div>
                    <Favorite contentRemote={comment} />
                    &nbsp;•&nbsp;
                    <Delete contentRemote={comment} />
                  </div>
                ) : null}
              </div>
            </Comment>
          ))}
        </StyledComments>
      ) : null}
    </div>
  );
}
