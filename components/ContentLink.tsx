import { ReactNode, useContext } from 'react';

import { Content } from 'data/graphql-generated';
import { Link } from 'components';
import { LinkProps } from '@mui/material';
import UserContext from 'app/UserContext';
import { contentUrl } from 'util/url-factory';

export default function ContentLink(props: {
  children: ReactNode | string;
  item: Pick<Content, 'title' | 'forceRefresh' | 'hidden' | 'username' | 'section' | 'album' | 'name'>;
  currentContent?: Content;
  rel?: string;
  url?: string;
  className?: string;
  sx?: LinkProps['sx'];
  ref?: LinkProps['ref'];
}) {
  const { user } = useContext(UserContext);

  const item = props.item;
  const currentContent = props.currentContent || { forceRefresh: false };
  const isOwnerViewing = user?.username === item.username;
  const { rel, url } = props;

  return (
    <Link
      href={url || contentUrl(item)}
      title={item.title}
      className={props.className}
      target={item.forceRefresh || currentContent.forceRefresh ? '_self' : ''}
      ref={props.ref}
      rel={rel}
      sx={{ fontStyle: isOwnerViewing && item.hidden ? 'italic' : 'normal', ...props.sx }}
    >
      {props.children}
    </Link>
  );
}
