import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { F, FormattedDate } from 'i18n';
import { invalidateCountsSoon } from 'lib/invalidate-counts';
import { queueRead } from 'lib/read-queue';
import type { RemotePost } from 'lib/remote-queries';
import { createLiteYouTubeVideos } from 'util/media';
import Favorite from './actions/Favorite';
import Reblog from './actions/Reblog';
import Reply from './actions/Reply';
import KeepUnread from './actions/KeepUnread';
import styles from './dashboard.module.css';

export default function DashboardItem({ contentRemote }: { contentRemote: RemotePost }) {
  const queryClient = useQueryClient();
  const [keepUnread, setKeepUnread] = useState(false);
  const [read, setRead] = useState<boolean>(!!contentRemote.read);
  const itemRef = useRef<HTMLElement>(null);

  const readMutation = useMutation({
    mutationFn: (nextRead: boolean) => queueRead(contentRemote.fromUsername, contentRemote.postId, nextRead),
    onSuccess: () => invalidateCountsSoon(queryClient),
  });

  useEffect(() => {
    if (read || keepUnread) return;
    const onScroll = () => {
      const el = itemRef.current;
      if (!el) return;
      const doc = document.documentElement;
      const bottomOfFeed = doc.scrollTop + window.innerHeight >= doc.scrollHeight - 50;
      if (el.getBoundingClientRect().top < -50 || bottomOfFeed) {
        setRead(true);
        // Without the rollback a failed POST leaves the item faded here but
        // unread in the db, and the listener is already gone so it never retries.
        readMutation.mutate(true, { onError: () => setRead(false) });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [read, keepUnread]);

  const keepUnreadCb = (keep: boolean) => {
    if (keep && read) {
      setRead(false);
      readMutation.mutate(false, { onError: () => setRead(true) });
    }
    setKeepUnread(keep);
  };

  // Open remote links in a new tab + upgrade youtube embeds.
  let html = (contentRemote.view || '').replace(/<a ([^>]+)/g, '<a $1 target="_blank" rel="noreferrer noopener"');
  html = createLiteYouTubeVideos(html);

  const faded = read ? styles.itemRead : '';

  return (
    <article ref={itemRef} className={styles.item}>
      {contentRemote.title ? (
        <header className={styles.itemHeader}>
          {contentRemote.avatar ? <img className={styles.itemAvatar} src={contentRemote.avatar} alt="" /> : null}
          <h1 className={`${styles.itemTitle} ${faded} notranslate`} title={contentRemote.title}>
            <a href={contentRemote.link} target="_blank" rel="noreferrer noopener">
              {contentRemote.title}
            </a>
          </h1>
        </header>
      ) : null}
      {contentRemote.creator ? (
        <div className={styles.itemCreator}>
          <F defaultMessage="by {creator}" values={{ creator: contentRemote.creator }} />
        </div>
      ) : null}

      <div className={`${styles.itemView} notranslate`} dangerouslySetInnerHTML={{ __html: html }} />

      <footer className={styles.itemFooter}>
        <span>
          <a href={contentRemote.link} target="_blank" rel="noreferrer noopener">
            <F
              defaultMessage="{username} posted on {date}"
              values={{
                username: contentRemote.username,
                date: (
                  <time dateTime={contentRemote.createdAt}>
                    <FormattedDate
                      value={contentRemote.createdAt}
                      year="numeric"
                      month="long"
                      day="2-digit"
                      hour="2-digit"
                      minute="2-digit"
                    />
                  </time>
                ),
              }}
            />
          </a>
        </span>
        <span className={styles.itemActions}>
          <Reblog contentRemote={contentRemote} />
          <Favorite contentRemote={contentRemote} isDashboard />
          <KeepUnread keepUnreadCb={keepUnreadCb} />
          <Reply contentRemote={contentRemote} />
        </span>
      </footer>
    </article>
  );
}
