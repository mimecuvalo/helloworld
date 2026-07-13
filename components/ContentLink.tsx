import type { ReactNode, Ref } from 'react';
import { Link } from '@tanstack/react-router';
import { contentUrl } from 'lib/url-factory';

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
      <Link ref={ref} to={href} title={item.title || undefined} className={className} rel={rel}>
        {children}
      </Link>
    );
  }

  return (
    <a ref={ref} href={href} title={item.title || undefined} className={className} target="_self" rel={rel}>
      {children}
    </a>
  );
}
