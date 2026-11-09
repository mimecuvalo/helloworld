import type { ReactNode, Ref } from 'react';
import { Link } from '@tanstack/react-router';
import { contentUrl } from 'lib/url-factory';
import Tooltip from 'components/Tooltip';

type ContentItem = {
  title?: string | null;
  forceRefresh?: boolean | null;
  hidden?: boolean | null;
  username: string;
  section: string;
  album: string;
  name: string;
};

export default function ContentLink(props: {
  children: ReactNode;
  item: ContentItem;
  currentContent?: { forceRefresh?: boolean | null } | null;
  rel?: string;
  url?: string;
  className?: string;
  ref?: Ref<HTMLAnchorElement>;
}) {
  const { children, item, currentContent, rel, url, className, ref } = props;
  const href = url || contentUrl(item);
  const forceRefresh = item.forceRefresh || currentContent?.forceRefresh;

  if (!forceRefresh) {
    return (
      <Tooltip label={item.title}>
        <Link ref={ref} to={href} className={className} rel={rel}>
          {children}
        </Link>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={item.title}>
      <a ref={ref} href={href} className={className} target="_self" rel={rel}>
        {children}
      </a>
    </Tooltip>
  );
}
