import 'styles/content-theme.css';
import { Link } from '@tanstack/react-router';
import { F } from 'i18n';
import { UserProvider } from 'lib/user-context';
import OrganizeSitemap from 'components/dashboard/OrganizeSitemap';
import styles from 'components/dashboard/dashboard.module.css';

type OrganizeUser = { username: string; theme?: string | null };

// Sidebar order gets a page of its own rather than a panel in the dashboard:
// it is about the shape of the whole site, not about anything being read or
// written at the moment, and a long sitemap needs the room to drag around in.
export default function OrganizePage({ user }: { user: OrganizeUser }) {
  return (
    <UserProvider user={{ username: user.username }}>
      <div className="hw-content-theme" data-theme={user.theme || 'nightlight'}>
        <div className={styles.organizePage}>
          <Link to="/dashboard" className={styles.organizeBack}>
            <F defaultMessage="← dashboard" />
          </Link>
          <OrganizeSitemap username={user.username} />
        </div>
      </div>
    </UserProvider>
  );
}
