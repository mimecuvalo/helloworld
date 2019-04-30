import { defineMessages, injectIntl } from '../../shared/i18n';
import Delete from '../dashboard/actions/Delete';
import Favorite from '../dashboard/actions/Favorite';
import React, { PureComponent } from 'react';
import styles from './Content.module.css';
import UserContext from '../app/User_Context';

const messages = defineMessages({
  avatar: { msg: 'avatar' },
});

@injectIntl
class Comments extends PureComponent {
  render() {
    const { comments, content } = this.props;
    const ariaImgMsg = this.props.intl.formatMessage(messages.avatar);

    return (
      <ul>
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
              {comment.view}
            </div>
            <UserContext.Consumer>
              {({ user }) => {
                const isOwnerViewing = user?.model?.username === content.username;

                return isOwnerViewing ? (
                  <div className={styles.actions}>
                    <Favorite contentRemote={comment} />
                    &nbsp;•&nbsp;
                    <Delete contentRemote={comment} />
                  </div>
                ) : null;
              }}
            </UserContext.Consumer>
          </li>
        ))}
      </ul>
    );
  }
}
export default Comments;
