import { defineMessages, injectIntl } from '../../shared/i18n';
import React, { PureComponent } from 'react';
import styles from './Content.module.css';

const messages = defineMessages({
  avatar: { msg: 'avatar' },
});

@injectIntl
class Comments extends PureComponent {
  render() {
    const { comments } = this.props;
    const ariaImgMsg = this.props.intl.formatMessage(messages.avatar);

    return (
      <ul>
        {comments.map(comment => (
          <li className={styles.comment}>
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
          </li>
        ))}
      </ul>
    );
  }
}
export default Comments;
