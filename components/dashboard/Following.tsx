import { type KeyboardEvent, useRef } from 'react';
import { F, FormattedNumber, defineMessages, useIntl } from 'i18n';
import { useCounts, useFollowing, type HandleSetFeed, type RemoteUser } from 'lib/remote-queries';
import FollowingMenu from './FollowingMenu';
import FollowingAllMenu from './FollowingAllMenu';
import NewFeed from './actions/NewFeed';
import styles from './dashboard.module.css';

const messages = defineMessages({
  search: { defaultMessage: 'search' },
});

export default function Following({
  handleSetFeed,
  userRemote,
  userFavicon,
}: {
  specialFeed: string;
  userRemote: RemoteUser | null;
  userFavicon?: string | null;
  handleSetFeed: HandleSetFeed;
}) {
  const intl = useIntl();
  const searchInput = useRef<HTMLInputElement>(null);
  const following = useFollowing();
  const allCounts = useCounts();

  if (following.isPending || !following.data) return null;

  const counts = allCounts.data || { totalCount: 0, favoritesCount: 0, commentsCount: 0, feeds: [] };
  const countByUrl = new Map(counts.feeds.map((f) => [f.fromUsername, f.count]));
  const avatar = <img className={styles.feedIcon} src={userFavicon || '/favicon.jpg'} alt="" />;

  const handleSearchKeyUp = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter') handleSetFeed('', searchInput.current?.value || '');
  };

  return (
    <div className={styles.followingBox}>
      <h2>
        <F defaultMessage="following" />
      </h2>

      <ul className={styles.feedList}>
        <li className={styles.feedItemRow}>
          <button type="button" className={styles.feedButton} onClick={() => handleSetFeed('')}>
            <span className={styles.feedIcon} aria-hidden="true" />
            <span className="feed-name">
              <F defaultMessage="read all" />
            </span>
            <span className={styles.feedCount}>
              <FormattedNumber value={counts.totalCount} />
            </span>
          </button>
          <FollowingAllMenu />
        </li>
        <li className={styles.feedItemRow}>
          <button type="button" className={styles.feedButton} onClick={() => handleSetFeed('me')}>
            {avatar}
            <span className="feed-name">
              <F defaultMessage="your feed" />
            </span>
          </button>
          <span className={styles.menuSpacer} aria-hidden="true" />
        </li>
        <li className={styles.feedItemRow}>
          <button type="button" className={styles.feedButton} onClick={() => handleSetFeed('favorites')}>
            {avatar}
            <span className="feed-name">
              <F defaultMessage="favorites" />
            </span>
            <span className={styles.feedCount}>
              <FormattedNumber value={counts.favoritesCount} />
            </span>
          </button>
          <span className={styles.menuSpacer} aria-hidden="true" />
        </li>
        <li className={styles.feedItemRow}>
          <button type="button" className={styles.feedButton} onClick={() => handleSetFeed('comments')}>
            {avatar}
            <span className="feed-name">
              <F defaultMessage="comments" />
            </span>
            <span className={styles.feedCount}>
              <FormattedNumber value={counts.commentsCount} />
            </span>
          </button>
          <span className={styles.menuSpacer} aria-hidden="true" />
        </li>

        {following.data.map((feed) => (
          <li
            key={feed.profileUrl}
            className={styles.feedItemRow}
            style={{ fontWeight: userRemote?.profileUrl === feed.profileUrl ? 'bold' : 'normal' }}
          >
            <button
              type="button"
              className={`${styles.feedButton} notranslate`}
              onClick={() => handleSetFeed(feed)}
              title={feed.name || feed.username}
            >
              <img className={styles.feedIcon} src={feed.favicon || feed.avatar || '/favicon.jpg'} alt="" />
              <span className="feed-name">{feed.name || feed.username}</span>
              <span className={styles.feedCount}>
                <FormattedNumber value={countByUrl.get(feed.profileUrl) || 0} />
              </span>
            </button>
            <FollowingMenu userRemote={feed} handleSetFeed={handleSetFeed} />
          </li>
        ))}
      </ul>

      <NewFeed handleSetFeed={handleSetFeed} />

      <search>
        <input
          ref={searchInput}
          type="search"
          className={`${styles.searchInput} notranslate`}
          onKeyUp={handleSearchKeyUp}
          placeholder={intl.formatMessage(messages.search)}
        />
      </search>
    </div>
  );
}
