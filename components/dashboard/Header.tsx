import { Avatar, styled } from 'components';
import { F, defineMessages, useIntl } from 'i18n';

const StyledHeader = styled('header')`
  position: sticky;
  top: 0;
  background: #fafafa;
  margin-bottom: 7px;
  padding: 0 6px;
  width: calc(100% - 4px);
  box-shadow: 0 -6px #fafafa, 1px 1px 0 #fa0, 2px 2px 0 #fa0, 3px 3px 0 #fa0, 0 0 0 8px #fafafa !important;
`;

const Creator = styled('div')`
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;
`;

const Title = styled('h1')<{ $isRead: boolean }>`
  margin: 3px 3px 3px 0;

  ${(props) =>
    props.$isRead &&
    `
    font-weight: 500;
  `}
`;

const messages = defineMessages({
  avatar: { defaultMessage: 'avatar' },
});

export default function Header({ contentRemote }: { contentRemote: ContentRemote }) {
  const intl = useIntl();
  const { avatar, creator, link, read, title } = contentRemote;
  const avatarAltText = intl.formatMessage(messages.avatar);

  return (
    <>
      {title ? (
        <StyledHeader>
          <Title $isRead={read} className="notranslate">
            <a href={link} target="_blank" rel="noopener noreferrer">
              {title}
            </a>
          </Title>
        </StyledHeader>
      ) : null}
      {creator ? (
        <Creator>
          <F defaultMessage="by {creator}" values={{ creator }} />
        </Creator>
      ) : null}
      {avatar ? <Avatar src={avatar} alt={avatarAltText} /> : null}
    </>
  );
}
