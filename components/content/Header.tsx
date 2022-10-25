import { Content } from 'data/graphql-generated';
import ContentLink from 'components/ContentLink';
import { F } from 'i18n';
import UserContext from 'app/UserContext';
import { styled } from 'components';
import { useContext } from 'react';

const StyledHeader = styled('header')`
  margin-bottom: 6px;
  padding: 6px 10px;
  position: sticky;
  top: 0;
  background: #111;
  z-index: 1;
`;

const Title = styled('h1')`
  display: flex;
  margin: 3px 3px 3px 0;
  font-size: 24px;
  font-weight: 400;

  & a {
    flex: 1;
    color: #fff;
  }

  & a:visited {
    color: #fff;
  }
`;

// const EditButton = styled('button')`
//   line-height: 14px;
//   font-size: 12px;
//   font-weight: 500;
//   margin-bottom: 2px;
//   padding: 0 7px;
//   color: #060;
//   align-self: flex-start;
// `;

export default function Header({ content }: { content: Content }) {
  const { user } = useContext(UserContext);
  const isOwnerViewing = user?.username === content.username;

  return (
    <StyledHeader>
      <Title>
        <ContentLink item={content} currentContent={content}>
          <span className="p-name">{content.title && <span className="notranslate">{content.title}</span>}</span>
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
      </Title>
    </StyledHeader>
  );
}
