import { Link, styled } from 'components';
import { PropsWithChildren, Ref, useContext } from 'react';

import { Content } from '@prisma/client';
import UserContext from 'app/UserContext';
import { contentUrl } from 'util/url-factory';

const StyledLink = styled(Link)<{
  $isHidden: boolean;
}>`
  ${props.$isHidden && `font-style: italic;`}
`;

const ContentLink: React.FC<
  PropsWithChildren<{
    item: Content;
    currentContent: Content;
    rel?: string;
    innerRef?: Ref;
    url?: string;
    className?: string;
  }>
> = (props) => {
  const user = useContext(UserContext).user;

  const item = props.item;
  const currentContent = props.currentContent || {};
  const isOwnerViewing = user?.model?.username === item.username;
  const { rel, innerRef, url } = props;

  return (
    <StyledLink
      to={url || contentUrl(item)}
      title={item.title}
      $isHidden={isOwnerViewing && item.hidden}
      className={props.className}
      target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
      rel={rel}
      innerRef={innerRef}
    >
      {props.children}
    </StyledLink>
  );
};

export default ContentLink;
