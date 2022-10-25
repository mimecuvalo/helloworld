import { Avatar, styled } from 'components';
import { F, defineMessages, useIntl } from 'i18n';

import { Favorite } from 'data/graphql-generated';

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

export default function Favorites({ favorites }: { favorites?: Favorite[] }) {
  const intl = useIntl();
  const ariaImgMsg = intl.formatMessage(messages.avatar);

  if (!favorites) {
    return null;
  }

  return (
    <ul>
      {favorites?.map((favorite) => (
        <StyledFavorite key={favorite.postId}>
          <Avatar src={favorite.avatar || '/img/pixel.gif'} alt={ariaImgMsg} />
          <F
            defaultMessage="{user}: favorited this post."
            values={{
              user: (
                <Author>
                  {favorite.fromUsername ? (
                    <a href={favorite.fromUsername} target="_blank" rel="noopener noreferrer">
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
