import 'styles/content-theme.css';
import { useState } from 'react';
import { defineMessages, useIntl } from 'i18n';
import { UserProvider } from 'lib/user-context';
import { EditorProvider } from 'lib/editor-context';
import type { HandleSetFeed, RemoteUser } from 'lib/remote-queries';
import Tools from 'components/dashboard/Tools';
import BlueskyLink from 'components/dashboard/BlueskyLink';
import MastodonLink from 'components/dashboard/MastodonLink';
import Following from 'components/dashboard/Following';
import Followers from 'components/dashboard/Followers';
import DashboardEditor from 'components/dashboard/DashboardEditor';
import DashboardFeed from 'components/dashboard/DashboardFeed';
import Feed from 'components/content/Feed';
import styles from 'components/dashboard/dashboard.module.css';

type DashboardUser = {
  username: string;
  name?: string | null;
  title?: string | null;
  favicon?: string | null;
  logo?: string | null;
  theme?: string | null;
  blueskyHandle?: string | null;
  mastodonUrl?: string | null;
};

const messages = defineMessages({
  menu: { defaultMessage: 'Menu' },
});

export default function DashboardPage({ user }: { user: DashboardUser }) {
  const intl = useIntl();
  const [userRemote, setUserRemote] = useState<RemoteUser | null>(null);
  const [specialFeed, setSpecialFeed] = useState('');
  const [query, setQuery] = useState('');
  const [shouldShowAllItems, setShouldShowAllItems] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSetFeed: HandleSetFeed = (feed, nextQuery, allItems) => {
    setQuery(nextQuery || '');
    setShouldShowAllItems(!!allItems);
    if (typeof feed === 'string') {
      setSpecialFeed(feed);
      setUserRemote(null);
    } else {
      setSpecialFeed('');
      setUserRemote(feed);
    }
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <UserProvider user={{ username: user.username }}>
      <EditorProvider>
        <div className="hw-content-theme" data-theme={(user.theme as string) || 'nightlight'}>
          <div className={styles.dashboard}>
            <button
              type="button"
              className={`${styles.navToggle} notranslate`}
              aria-label={intl.formatMessage(messages.menu)}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((o) => !o)}
            >
              ☰
            </button>

            <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
              <Tools user={user} />
              <Following
                handleSetFeed={handleSetFeed}
                specialFeed={specialFeed}
                userRemote={userRemote}
                userFavicon={user.favicon}
              />
              <Followers handleSetFeed={handleSetFeed} />
              <BlueskyLink linkedHandle={user.blueskyHandle} />
              <MastodonLink linkedUrl={user.mastodonUrl} />
            </nav>

            <div className={styles.content}>
              <DashboardEditor username={user.username} />
              {specialFeed === 'me' ? (
                <Feed content={{ username: user.username, section: 'main', name: 'home' }} contentOwner={user} />
              ) : (
                <DashboardFeed
                  userRemote={userRemote}
                  specialFeed={specialFeed}
                  query={query}
                  shouldShowAllItems={shouldShowAllItems}
                />
              )}
            </div>
          </div>
        </div>
      </EditorProvider>
    </UserProvider>
  );
}
