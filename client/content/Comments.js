import classNames from 'classnames';
import ContentQuery from './ContentQuery';
import { createLock } from '../app/auth';
import { defineMessages, F, injectIntl } from '../../shared/i18n';
import Delete from '../dashboard/actions/Delete';
import { Editor } from 'hello-world-editor';
import Favorite from '../dashboard/actions/Favorite';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React, { Component } from 'react';
import styles from './Comments.module.css';
import UserContext from '../app/User_Context';
import { withSnackbar } from 'notistack';

const messages = defineMessages({
  avatar: { msg: 'avatar' },
  error: { msg: 'Error updating content.' },
});

@graphql(gql`
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
`)
@injectIntl
@withSnackbar
class Comments extends Component {
  constructor(props) {
    super(props);

    this.commentEditor = React.createRef();

    this.state = {
      isPosting: false,
    };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = evt => {
    if (!this.commentEditor || !this.commentEditor.current) {
      return;
    }

    // TODO(mime): combine this logic somewhere. (also in keyboard.js)
    const isMac = navigator.platform.toLowerCase().indexOf('mac') !== -1;
    const isAccelKey = isMac ? evt.metaKey : evt.ctrlKey;
    if (isAccelKey && evt.key === 'Enter') {
      this.handlePost();
    }
  };

  handlePost = async evt => {
    const { username, name } = this.props.content;
    const editor = this.commentEditor.current;
    const content = JSON.stringify(editor.export());
    editor.clear();

    const variables = { username, name, content };

    this.setState({ isPosting: true });

    try {
      await this.props.mutate({
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
      this.props.enqueueSnackbar(this.props.intl.formatMessage(messages.error), { variant: 'error' });
    }

    this.setState({ isPosting: false });
  };

  handleLogin = evt => {
    createLock().show();
  };

  render() {
    const { comments, content } = this.props;
    const ariaImgMsg = this.props.intl.formatMessage(messages.avatar);

    return (
      <UserContext.Consumer>
        {({ user }) => {
          const isLoggedIn = !!user;
          const isOwnerViewing = user?.model?.username === content.username;

          return (
            <div className="hw-comments">
              <h3 className={styles.commentsHeader}>
                <F msg="comments" />
              </h3>
              {isLoggedIn ? (
                <div id="hw-comment-editor" className={styles.commentEditorWrapper}>
                  <Editor
                    editorKey="comments"
                    content={{}}
                    ref={this.commentEditor}
                    type="comment"
                    dontWarnOnUnsaved={true}
                  />
                  <button
                    className={classNames('hw-button', 'hw-save')}
                    disabled={this.state.isPosting}
                    onClick={this.handlePost}
                  >
                    <F msg="post" />
                  </button>
                </div>
              ) : (
                <F
                  msg="Please {login} to leave a comment."
                  values={{
                    login: (
                      <button className="hw-button-link" onClick={this.handleLogin}>
                        <F msg="login" />
                      </button>
                    ),
                  }}
                />
              )}
              {comments ? (
                <ul className={styles.comments}>
                  {comments.map(comment => (
                    <li className={styles.comment} key={comment.post_id}>
                      <img className={styles.avatar} src={comment.avatar || '/img/pixel.gif'} alt={ariaImgMsg} />
                      <div>
                        {comment.from_user ? (
                          <a href={comment.from_user} target="_blank" rel="noopener noreferrer">
                            {comment.username}
                          </a>
                        ) : (
                          <span className={styles.author}>{comment.username}: </span>
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
        }}
      </UserContext.Consumer>
    );
  }
}
export default Comments;
