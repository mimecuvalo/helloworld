import { Avatar, Link, List, ListItem, styled } from 'components';
import { F, defineMessages, useIntl } from 'i18n';

import { Favorite } from 'data/graphql-generated';

const StyledFavorite = styled(ListItem)`
  display: flex;
  margin-bottom: ${(props) => props.theme.spacing(1)};
  clear: both;
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
    <List>
      {favorites?.map((favorite) => (
        <StyledFavorite key={favorite.postId}>
          <Avatar src={favorite.avatar || '/img/pixel.gif'} alt={ariaImgMsg} sx={{ width: 16, height: 16 }} />
          <F
            defaultMessage="{user}: favorited this post."
            values={{
              user: (
                <Author>
                  {favorite.fromUsername ? (
                    <Link href={favorite.fromUsername} target="_blank">
                      {favorite.username}
                    </Link>
                  ) : (
                    <span>{favorite.username}</span>
                  )}
                </Author>
              ),
            }}
          />
        </StyledFavorite>
      ))}
    </List>
  );
}
