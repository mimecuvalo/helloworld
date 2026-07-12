import { useEffect, useRef } from 'react';
import Masonry from 'react-masonry-css';
import { F } from 'i18n';
import { useFeedPaginated, type RemoteUser } from 'lib/remote-queries';
import DashboardItem from './DashboardItem';
import contentStyles from '../content/content.module.css';
import styles from './dashboard.module.css';

export default function DashboardFeed({
  userRemote,
  specialFeed,
  query,
  shouldShowAllItems,
}: {
  userRemote: RemoteUser | null;
  specialFeed: string;
  query: string;
  shouldShowAllItems: boolean;
}) {
  const profileUrlOrSpecialFeed = userRemote ? userRemote.profileUrl : specialFeed;
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } = useFeedPaginated(
    profileUrlOrSpecialFeed,
    query,
    shouldShowAllItems
  );
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

  const feed = data.pages.flat();
  const breakpointColumnsObj = { default: 3, 960: 1 };

  return (
    <div className={styles.feed}>
      {userRemote || query ? (
        <h1 className={styles.feedHeader}>
          {userRemote ? (
            <a href={userRemote.profileUrl} target="_blank" rel="noreferrer noopener" className="notranslate">
              {userRemote.username}
            </a>
          ) : (
            <>
              <F defaultMessage="Search:" /> {query}
            </>
          )}
        </h1>
      ) : null}

      {!feed.length ? (
        <div>
          <F defaultMessage="Nothing to read right now!" />
        </div>
      ) : (
        <Masonry breakpointCols={breakpointColumnsObj} className="masonry-grid" columnClassName="masonry-grid_column">
          {feed.map((item) => (
            <div className={`${contentStyles.feedItem} hw-item`} key={item.postId}>
              <DashboardItem contentRemote={item} />
            </div>
          ))}
        </Masonry>
      )}
      <div ref={sentinelRef} className={styles.feedSentinel} aria-hidden="true" />
    </div>
  );
}
