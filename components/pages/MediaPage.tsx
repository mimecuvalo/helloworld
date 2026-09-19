import 'styles/content-theme.css';
import { Link } from '@tanstack/react-router';
import { F } from 'i18n';
import { UserProvider } from 'lib/user-context';
import MediaManager from 'components/dashboard/MediaManager';
import styles from 'components/dashboard/dashboard.module.css';

type MediaUser = { username: string; theme?: string | null };

// Like the sitemap, this gets a page rather than a panel: a bucket is browsed
// rather than glanced at, and a grid of photographs needs the whole width.
export default function MediaPage({ user }: { user: MediaUser }) {
  return (
    <UserProvider user={{ username: user.username }}>
      <div className="hw-content-theme" data-theme={user.theme || 'nightlight'}>
        <div className={styles.mediaPage}>
          <Link to="/dashboard" className={styles.organizeBack}>
            <F defaultMessage="← dashboard" />
          </Link>
          <MediaManager username={user.username} />
        </div>
      </div>
    </UserProvider>
  );
}
