import { Link, styled } from 'components';
import { PropsWithChildren, useContext } from 'react';

import { Content } from 'data/graphql-generated';
import UserContext from 'app/UserContext';
import { contentUrl } from 'util/url-factory';

const StyledLink = styled(Link)<{
  $isHidden: boolean;
}>`
  ${(props) => props.$isHidden && `font-style: italic;`}
`;

const ContentLink: React.FC<
  PropsWithChildren<{
    item: Pick<Content, 'title' | 'forceRefresh' | 'hidden' | 'username' | 'section' | 'album' | 'name'>;
    currentContent?: Content;
    rel?: string;
    url?: string;
    className?: string;
  }>
> = (props) => {
  const { user } = useContext(UserContext);

  const item = props.item;
  const currentContent = props.currentContent || { forceRefresh: false };
  const isOwnerViewing = user?.username === item.username;
  const { rel, url } = props;

  return (
    <StyledLink
      to={url || contentUrl(item)}
      title={item.title}
      $isHidden={isOwnerViewing && item.hidden}
      className={props.className}
      target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
      rel={rel}
    >
      {props.children}
    </StyledLink>
  );
};

export default ContentLink;
