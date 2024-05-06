import { Avatar, Link, Tooltip, Typography, styled } from 'components';
import { F, defineMessages, useIntl } from 'i18n';

import { Post } from 'data/graphql-generated';

const StyledHeader = styled('header')`
  position: sticky;
  top: 0;
  height: 77px;
  background: ${(props) => props.theme.palette.background.default};
  padding: ${(props) => props.theme.spacing(1, 1.5)};

  & h1 > a {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 5;
    overflow: hidden;
  }
`;

const Creator = styled(Typography)`
  margin-bottom: ${(props) => props.theme.spacing(1)};
  padding: ${(props) => props.theme.spacing(0.5)};
  color: ${(props) => props.theme.palette.grey[600]};
`;

const messages = defineMessages({
  avatar: { defaultMessage: 'avatar' },
});

// TODO(mime): we can do better than this manuallyMarkedAsRead kludge.
export default function Header({
  contentRemote,
  manuallyMarkedAsRead,
}: {
  contentRemote: Post;
  manuallyMarkedAsRead: boolean;
}) {
  const intl = useIntl();
  const { avatar, creator, link, read, title } = contentRemote;
  const avatarAltText = intl.formatMessage(messages.avatar);

  return (
    <>
      {title ? (
        <StyledHeader>
          <Tooltip title={title} placement="top-start">
            <Typography
              variant="h1"
              className="notranslate"
              sx={{
                fontStyle: read || manuallyMarkedAsRead ? 'italic' : undefined,
                opacity: read || manuallyMarkedAsRead ? 0.3 : undefined,
              }}
            >
              <Link href={link} target="_blank">
                {title}
              </Link>
            </Typography>
          </Tooltip>
        </StyledHeader>
      ) : null}
      {creator ? (
        <Creator variant="subtitle1">
          <F defaultMessage="by {creator}" values={{ creator }} />
        </Creator>
      ) : null}
      {avatar ? <Avatar src={avatar} alt={avatarAltText} /> : null}
    </>
  );
}
