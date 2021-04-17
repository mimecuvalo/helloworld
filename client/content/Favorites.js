import { F, defineMessages, useIntl } from 'react-intl-wrapper';

import { useStyles } from './Comments';

const messages = defineMessages({
  avatar: { msg: 'avatar' },
});

export default function Favorites({ favorites }) {
  const intl = useIntl();
  const ariaImgMsg = intl.formatMessage(messages.avatar);
  const styles = useStyles();

  if (!favorites) {
    return null;
  }

  return (
    <ul>
      {favorites?.map((favorite) => (
        <li className={styles.favorite} key={favorite.post_id}>
          <img className={styles.avatar} src={favorite.avatar || '/img/pixel.gif'} alt={ariaImgMsg} />
          <F
            msg="{user}: favorited this post."
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
