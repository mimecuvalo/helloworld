import { type ReactNode, type Ref, useEffect, useImperativeHandle, useRef } from 'react';
import { F } from 'i18n';
import ContentLink from 'components/ContentLink';
import { contentUrl } from 'lib/url-factory';
import styles from './content.module.css';

type Neighbor = {
  username: string;
  section: string;
  album: string;
  name: string;
  title?: string | null;
  forceRefresh?: boolean | null;
  hidden?: boolean | null;
  template?: string | null;
  prefetchImages?: string[] | null;
} | null;

type Neighbors = { first: Neighbor; prev: Neighbor; top: Neighbor; next: Neighbor; last: Neighbor } | null;

type NavContent = {
  template?: string | null;
  section: string;
  album: string;
  name: string;
  forceRefresh?: boolean | null;
};

export default function Nav({
  content,
  neighbors,
  ref,
}: {
  content: NavContent;
  neighbors: Neighbors;
  ref?: Ref<{ prev: () => void; next: () => void }>;
}) {
  const next = useRef<HTMLAnchorElement>(null);
  const top = useRef<HTMLAnchorElement>(null);
  const prev = useRef<HTMLAnchorElement>(null);

  useImperativeHandle(ref, () => ({
    prev: () => prev.current?.click(),
    next: () => next.current?.click(),
  }));

  useEffect(() => {
    const handleKeyUp = (evt: KeyboardEvent) => {
      switch (evt.key) {
        case 'ArrowUp':
          top.current?.click();
          break;
        case 'ArrowLeft':
          next.current?.click();
          break;
        case 'ArrowRight':
          prev.current?.click();
          break;
      }
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, []);

  if (
    content.template === 'feed' ||
    content.section === 'main' ||
    content.album === 'main' ||
    content.name === 'main'
  ) {
    return null;
  }
  if (!neighbors) return null;

  function renderLink(meta: Neighbor, name: string, msg: ReactNode, linkRef?: Ref<HTMLAnchorElement>) {
    const url = meta ? contentUrl(meta, meta.template === 'latest' ? { mode: 'archive' } : undefined) : '';

    if (!url || !meta) {
      return (
        <a href="#" className={`hw-${name}`} onClick={(evt) => evt.preventDefault()} style={{ cursor: 'default' }}>
          {msg}
        </a>
      );
    }

    // Preload surrounding images.
    if ((name === 'prev' || name === 'next') && typeof window !== 'undefined') {
      for (const img of meta.prefetchImages || []) new Image().src = img;
    }

    return (
      <ContentLink ref={linkRef} url={url} item={meta} currentContent={content} rel={name} className={`hw-${name}`}>
        {msg}
      </ContentLink>
    );
  }

  return (
    <nav className={styles.nav}>
      {renderLink(neighbors.last, 'last', <F defaultMessage="last" />)}
      {renderLink(neighbors.next, 'next', <F defaultMessage="next" />, next)}
      {renderLink(neighbors.top, 'top', neighbors.top?.name ?? content.section, top)}
      {renderLink(neighbors.prev, 'prev', <F defaultMessage="prev" />, prev)}
      {renderLink(neighbors.first, 'first', <F defaultMessage="first" />)}
    </nav>
  );
}
