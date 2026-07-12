import { F, defineMessages, useIntl } from 'i18n';
import styles from './content.module.css';

type Favorite = {
  postId: string;
  avatar?: string | null;
  fromUsername?: string | null;
  username: string;
};

const messages = defineMessages({
  avatar: { defaultMessage: 'avatar' },
});

export default function Favorites({ favorites }: { favorites?: Favorite[] }) {
  const intl = useIntl();
  const ariaImgMsg = intl.formatMessage(messages.avatar);

  if (!favorites?.length) return null;

  return (
    <ul className={styles.favorites}>
      {favorites.map((favorite) => (
        <li key={favorite.postId} className={styles.favorite}>
          <img className={styles.commentAvatar} src={favorite.avatar || '/img/pixel.gif'} alt={ariaImgMsg} />
          <F
            defaultMessage="{user}: favorited this post."
            values={{
              user: (
                <strong>
                  {favorite.fromUsername ? (
                    <a href={favorite.fromUsername} target="_blank" rel="noopener noreferrer">
                      {favorite.username}
                    </a>
                  ) : (
                    <span>{favorite.username}</span>
                  )}
                </strong>
              ),
            }}
          />
        </li>
      ))}
    </ul>
  );
}
