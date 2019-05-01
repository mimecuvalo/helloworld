import { defineMessages, F, injectIntl } from '../../shared/i18n';
import React, { PureComponent } from 'react';
import styles from './Comments.module.css';

const messages = defineMessages({
  avatar: { msg: 'avatar' },
});

@injectIntl
class Favorites extends PureComponent {
  render() {
    const { favorites } = this.props;
    const ariaImgMsg = this.props.intl.formatMessage(messages.avatar);

    return (
      <ul>
        {favorites.map(favorite => (
          <li className={styles.favorite} key={favorite.post_id}>
            <img className={styles.avatar} src={favorite.avatar || '/img/pixel.gif'} alt={ariaImgMsg} />
            <F
              msg={'{user}: favorited this post.'}
              values={{
                user: (
                  <span className={styles.author}>
                    {favorite.from_user ? (
                      <a href={favorite.from_user} target="_blank" rel="noopener noreferrer">
                        {favorite.username}
                      </a>
                    ) : (
                      <span>{favorite.username}</span>
                    )}
                  </span>
                ),
              }}
            />
          </li>
        ))}
      </ul>
    );
  }
}
export default Favorites;
