import classNames from 'classnames';
import configuration from '../app/configuration';
import ContentQuery from './ContentQuery';
import { createLock } from '../app/auth';
import { createUseStyles } from 'react-jss';
import { defineMessages, F, useIntl } from 'react-intl-wrapper';
import Delete from '../dashboard/actions/Delete';
//import { Editor } from 'hello-world-editor';
import Favorite from '../dashboard/actions/Favorite';
import gql from 'graphql-tag';
import React, { useContext, useEffect, useRef, useState } from 'react';
import UserContext from '../app/User_Context';
import { useMutation } from '@apollo/client';
import { useSnackbar } from 'notistack';

export const useStyles = createUseStyles({
  commentEditorWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  comment: {
    display: 'flex',
    marginBottom: '10px',
    clear: 'both',
    fontSize: '11px',
  },
  favorite: {
    display: 'flex',
    marginBottom: '10px',
    clear: 'both',
    fontSize: '11px',
  },
  commentsHeader: {
    borderBottom: '1px solid #ccc',
    paddingBottom: '3px',
    marginBottom: '10px',
    fontWeight: '500',
  },
  comments: {
    marginTop: '10px',
  },
  avatar: {
    maxWidth: '32px',
    maxHeight: '32px',
    margin: '0 10px 0 0',
  },
  author: {
    fontWeight: 'bold',
  },
});

const messages = defineMessages({
  avatar: { msg: 'avatar' },
  error: { msg: 'Error updating content.' },
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
  const styles = useStyles();

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

  const handleLogin = (evt) => {
    createLock().show();
  };

  const ariaImgMsg = intl.formatMessage(messages.avatar);
  const isLoggedIn = !!user;
  const isOwnerViewing = user?.model?.username === content.username;

  return (
    <div className="hw-comments">
      <h3 className={styles.commentsHeader}>
        <F msg="comments" />
      </h3>
      {isLoggedIn ? (
        <div id="hw-comment-editor" className={styles.commentEditorWrapper}>
          {/* <Editor
            editorKey="comments"
            content={{}}
            ref={commentEditor}
            type="comment"
            dontWarnOnUnsaved={true}
            locale={configuration.locale}
          /> */}
          <button className={classNames('hw-button', 'hw-save')} disabled={isPosting} onClick={handlePost}>
            <F msg="post" />
          </button>
        </div>
      ) : (
        <F
          msg="Please {login} to leave a comment."
          values={{
            login: (
              <button className="hw-button-link" onClick={handleLogin}>
                <F msg="login" />
              </button>
            ),
          }}
        />
      )}
      {comments ? (
        <ul className={styles.comments}>
          {comments.map((comment) => (
            <li className={styles.comment} key={comment.post_id}>
              <img className={styles.avatar} src={comment.avatar || '/img/pixel.gif'} alt={ariaImgMsg} />
              <div>
                {comment.from_user ? (
                  <a href={comment.from_user} target="_blank" rel="noopener noreferrer">
                    {comment.creator || comment.username}
                  </a>
                ) : (
                  <span className={styles.author}>{comment.creator || comment.username}: </span>
                )}
                <div dangerouslySetInnerHTML={{ __html: comment.view }} />

                {isOwnerViewing ? (
                  <div className={styles.actions}>
                    <Favorite contentRemote={comment} />
                    &nbsp;•&nbsp;
                    <Delete contentRemote={comment} />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
