import { F, defineMessages, useIntl } from 'i18n';

import { styled } from 'components';

const StyledFavorite = styled('li')`
  display: flex;
  margin-bottom: 10px;
  clear: both;
  font-size: 11px;
`;

const Author = styled('span')`
  font-weight: bold;
`;

const messages = defineMessages({
  avatar: { defaultMessage: 'avatar' },
});

export default function Favorites({ favorites }) {
  const intl = useIntl();
  const ariaImgMsg = intl.formatMessage(messages.avatar);

  if (!favorites) {
    return null;
  }

  return (
    <ul>
      {favorites?.map((favorite) => (
        <StyledFavorite key={favorite.post_id}>
          <img className={styles.avatar} src={favorite.avatar || '/img/pixel.gif'} alt={ariaImgMsg} />
          <F
            defaultMessage="{user}: favorited this post."
            values={{
              user: (
                <Author>
                  {favorite.from_user ? (
                    <a href={favorite.from_user} target="_blank" rel="noopener noreferrer">
                      {favorite.username}
                    </a>
                  ) : (
                    <span>{favorite.username}</span>
                  )}
                </Author>
              ),
            }}
          />
        </StyledFavorite>
      ))}
    </ul>
  );
}
