import { Comment as CommentType, Content } from 'data/graphql-generated';
import { F, defineMessages, useIntl } from 'i18n';

import Delete from 'components/dashboard/actions/Delete';
import Favorite from 'components/dashboard/actions/Favorite';
import UserContext from 'app/UserContext';
import { styled } from 'components';
import { useContext } from 'react';

const Comment = styled('li')`
  display: flex;
  margin-bottom: 10px;
  clear: both;
  font-size: 11px;
`;

const CommentsHeader = styled('h3')`
  border-bottom: 1px solid #ccc;
  padding-bottom: 3px;
  margin-bottom: 10px;
  font-weight: 50;
`;

const StyledComments = styled('ul')`
  margin-top: '10px';
`;

const Avatar = styled('img')`
  max-width: 32px;
  max-height: 32px;
  margin: 0 10px 0 0;
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

  return (
    <div className="hw-comments">
      <CommentsHeader>
        <F defaultMessage="comments" />
      </CommentsHeader>
      {/* {isLoggedIn ? (
        <CommentEditorWrapper id="hw-comment-editor">
          <button className="hw-button hw-save" disabled={isPosting} onClick={handlePost}>
            <F defaultMessage="post" />
          </button>
        </CommentEditorWrapper>
      ) : (
        <Login />
      )} */}
      {comments ? (
        <StyledComments>
          {comments.map((comment) => (
            <Comment key={comment.postId}>
              <Avatar src={comment.avatar || '/img/pixel.gif'} alt={ariaImgMsg} />
              <div>
                {comment.fromUsername ? (
                  <a href={comment.fromUsername} target="_blank" rel="noopener noreferrer">
                    {comment.creator || comment.username}
                  </a>
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
