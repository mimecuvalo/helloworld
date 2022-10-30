import { Tooltip, Typography, styled } from 'components';

import { Content } from 'data/graphql-generated';
import ContentLink from 'components/ContentLink';
import { F } from 'i18n';
import UserContext from 'app/UserContext';
import { useContext } from 'react';

const StyledHeader = styled('header')`
  position: sticky;
  top: ${(props) => props.theme.spacing(1)};
  max-height: 77px;
  align-self: stretch;
  background: ${(props) => props.theme.palette.background.default};
  padding: ${(props) => props.theme.spacing(1, 1.5)};
  border: 1px solid ${(props) => props.theme.palette.primary.light};
  box-shadow: 1px 1px ${(props) => props.theme.palette.primary.light},
    2px 2px ${(props) => props.theme.palette.primary.light}, 3px 3px ${(props) => props.theme.palette.primary.light};
  z-index: 1;

  & .p-name {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
`;

// const EditButton = styled(Button)`
//   padding: 0 ${(props) => props.theme.spacing(1)};
//   align-self: flex-start;
// `;

export default function Header({ content }: { content: Content }) {
  const { user } = useContext(UserContext);
  const isOwnerViewing = user?.username === content.username;

  if (!content.title) {
    return null;
  }

  return (
    <StyledHeader>
      <Tooltip title={content.title} placement="top-start">
        <Typography variant="h1">
          <ContentLink item={content} currentContent={content}>
            <span className="p-name notranslate">{content.title}</span>
            {isOwnerViewing && content.hidden && (
              <span>
                &nbsp;
                <F defaultMessage="(hidden)" />
              </span>
            )}
          </ContentLink>

          {/* {isOwnerViewing ? (
          <EditButton onClick={handleEdit}>
            <F defaultMessage="edit" />
          </EditButton>
        ) : null} */}
        </Typography>
      </Tooltip>
    </StyledHeader>
  );
}
