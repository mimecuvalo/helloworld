import { useEffect, useRef } from 'react';
import Masonry from 'react-masonry-css';
import { F } from 'i18n';
import { useCollectionPaginated } from 'lib/content-queries';
import Item from './Item';
import styles from './content.module.css';

export default function Feed({
  content,
  contentOwner,
}: {
  content: { username: string; section: string; name: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentOwner: any;
}) {
  const { username, section, name } = content;
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useCollectionPaginated({
    username,
    section,
    name,
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending || !data) return null;

  const collection = data.pages.flat();
  if (!collection.length) return <F defaultMessage="Nothing to read right now!" />;

  const breakpointColumnsObj = { default: 3, 960: 1 };

  return (
    <div className={styles.feed}>
      <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName="masonry-grid_column">
        {collection.map((item) => (
          <div className={styles.feedItem} key={item.name}>
            <Item content={item} contentOwner={contentOwner} isFeed />
          </div>
        ))}
      </Masonry>
      <div ref={sentinelRef} className={styles.feedSentinel} aria-hidden="true" />
    </div>
  );
}
