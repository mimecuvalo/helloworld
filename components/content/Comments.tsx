import { F, defineMessages, useIntl } from 'i18n';
import { Login, styled } from 'components';
import { Suspense, lazy, useContext, useEffect, useRef, useState } from 'react';
import { gql, useMutation } from '@apollo/client';

import ContentQuery from './ContentQuery';
import Delete from 'components/dashboard/actions/Delete';
import Favorite from 'components/dashboard/actions/Favorite';
import UserContext from 'app/UserContext';

const CommentEditorWrapper = styled('div')`
  display: flex;
  flex-direction: column;
`;

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

const POST_COMMENT = gql`
  mutation postComment($username: String!, $name: String!, $content: String!) {
    postComment(username: $username, name: $name, content: $content) {
      avatar
      content
      deleted
      favorited
      from_user
      link
      local_content_name
      post_id
      to_username
      type
      username
      view
    }
  }
`;

export default function Comments({ comments, content }) {
  const intl = useIntl();
  const snackbar = useSnackbar();
  const commentEditor = useRef(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postComment] = useMutation(POST_COMMENT);
  const user = useContext(UserContext).user;

  const handleKeyDown = (evt) => {
    if (!commentEditor || !commentEditor.current) {
      return;
    }

    // TODO(mime): combine this logic somewhere. (also in keyboard.js)
    const isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
    const isAccelKey = isMac ? evt.metaKey : evt.ctrlKey;
    if (isAccelKey && evt.key === 'Enter') {
      handlePost();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const handlePost = async (evt) => {
    const { username, name } = content;
    const editor = commentEditor.current;
    const commentContent = JSON.stringify(editor.export());
    editor.clear();

    const variables = { username, name, content: commentContent };

    setIsPosting(true);

    try {
      await postComment({
        variables,
        update: (store, { data: { postComment } }) => {
          const contentVariables = { username, name };
          const query = ContentQuery;
          const data = store.readQuery({ query, variables: contentVariables });
          data.fetchCommentsRemote.unshift(postComment);
          store.writeQuery({ query, variables: contentVariables, data });
        },
      });
    } catch (ex) {
      snackbar.enqueueSnackbar(intl.formatMessage(messages.error), { variant: 'error' });
    }

    setIsPosting(false);
  };

  const handleLogin = async (evt) => {
    (await createLock()).show();
  };

  const ariaImgMsg = intl.formatMessage(messages.avatar);
  const isLoggedIn = !!user;
  const isOwnerViewing = user?.model?.username === content.username;

  let editor = null;
  // TODO(mime): Suspense and lazy aren't supported by ReactDOMServer yet (breaks SSR).
  if (isLoggedIn && typeof window !== 'undefined') {
    const Editor = lazy(() => import('hello-world-editor').then((module) => ({ default: module.Editor })));
    return (
      <Suspense fallback={<div />}>
        <Editor
          editorKey="comments"
          content={{}}
          ref={commentEditor}
          type="comment"
          dontWarnOnUnsaved={true}
          locale={configuration.locale}
        />
      </Suspense>
    );
  }

  return (
    <div className="hw-comments">
      <CommentsHeader>
        <F defaultMessage="comments" />
      </CommentsHeader>
      {isLoggedIn ? (
        <CommentEditorWrapper id="hw-comment-editor">
          {editor}
          <button className={classNames('hw-button', 'hw-save')} disabled={isPosting} onClick={handlePost}>
            <F defaultMessage="post" />
          </button>
        </CommentEditorWrapper>
      ) : (
        <Login />
      )}
      {comments ? (
        <StyledComments>
          {comments.map((comment) => (
            <Comment key={comment.post_id}>
              <Avatar src={comment.avatar || '/img/pixel.gif'} alt={ariaImgMsg} />
              <div>
                {comment.from_user ? (
                  <a href={comment.from_user} target="_blank" rel="noopener noreferrer">
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
