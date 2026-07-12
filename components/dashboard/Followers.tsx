import { F } from 'i18n';
import { useFollowers, type HandleSetFeed } from 'lib/remote-queries';
import FollowerMenu from './FollowerMenu';
import styles from './dashboard.module.css';

export default function Followers({ handleSetFeed }: { handleSetFeed: HandleSetFeed }) {
  const { data, isPending } = useFollowers();
  if (isPending || !data) return null;

  return (
    <div className={styles.followingBox}>
      <h2>
        <F defaultMessage="followers" />
      </h2>
      <ul className={styles.feedList}>
        {data.map((follower) => (
          <li key={follower.profileUrl} className={styles.feedItemRow}>
            <button
              type="button"
              className={`${styles.feedButton} notranslate`}
              onClick={() => window.open(follower.profileUrl, follower.profileUrl, 'noopener,noreferrer')}
            >
              <img className={styles.feedIcon} src={follower.favicon || follower.avatar || '/favicon.jpg'} alt="" />
              <span className="feed-name">{follower.name || follower.username}</span>
            </button>
            <FollowerMenu userRemote={follower} handleSetFeed={handleSetFeed} />
          </li>
        ))}
      </ul>
    </div>
  );
}
