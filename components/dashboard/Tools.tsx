import { type AnchorHTMLAttributes, type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import { useNavigate } from '@tanstack/react-router';
import { F, defineMessages, useIntl } from 'i18n';
import { profileUrl } from 'lib/url-factory';
import DataLiberation from './actions/DataLiberation';
import EditProfile from './EditProfile';
import styles from './dashboard.module.css';

const messages = defineMessages({
  menu: { defaultMessage: 'account menu' },
});

type ToolsUser = { username: string; name?: string | null; favicon?: string | null; logo?: string | null };

export default function Tools({ user }: { user: ToolsUser }) {
  const intl = useIntl();
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);

  const bookmarklet = (pathname: string) =>
    `javascript:void((function(){var e=document.createElement('script');e.setAttribute('src','${origin}${pathname}?random='+(Math.random()*99999999));document.body.appendChild(e)})())`;

  const avatar = user.logo || user.favicon;

  return (
    <div className={styles.toolsBox}>
      <Menu.Root>
        <Menu.Trigger className={styles.accountTrigger} aria-label={intl.formatMessage(messages.menu)}>
          {avatar ? (
            <img className={styles.accountAvatar} src={avatar} alt="" width={32} height={32} />
          ) : (
            // No avatar set yet — an initial still reads as "this is you", and
            // keeps the trigger the same size either way.
            <span className={`${styles.accountAvatar} ${styles.accountAvatarFallback} notranslate`} aria-hidden="true">
              {(user.name || user.username).slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className={`${styles.accountName} notranslate`}>{user.name || user.username}</span>
          <span aria-hidden="true">▾</span>
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner sideOffset={4} side="bottom" align="start">
            <Menu.Popup className={styles.menuPopup}>
              <Menu.Item className={styles.menuItem} onClick={() => setIsEditingProfile(true)}>
                <F defaultMessage="edit profile" />
              </Menu.Item>

              <Menu.Item
                className={styles.menuItem}
                onClick={() => window.open(profileUrl(user.username), '_blank', 'noreferrer')}
              >
                <F defaultMessage="view site" />
              </Menu.Item>

              <Menu.Item className={styles.menuItem} onClick={() => navigate({ to: '/dashboard/organize' })}>
                <F defaultMessage="organize sidebar" />
              </Menu.Item>

              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={`${styles.menuItem} ${styles.submenuTrigger}`}>
                  <F defaultMessage="tools" />
                  <span aria-hidden="true">›</span>
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner sideOffset={4} side="right" align="start">
                    <Menu.Popup className={styles.menuPopup}>
                      <BookmarkletItem code={bookmarklet('/js/helloworld_follow.js')}>
                        <F defaultMessage="follow bookmarklet" />
                      </BookmarkletItem>
                      <BookmarkletItem code={bookmarklet('/js/helloworld_reblog.js')}>
                        <F defaultMessage="reblog bookmarklet" />
                      </BookmarkletItem>
                      <DataLiberation />
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>

              <Menu.Item className={styles.menuItem} onClick={() => (window.location.href = '/api/auth/signout')}>
                <F defaultMessage="logout" />
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <EditProfile open={isEditingProfile} onOpenChange={setIsEditingProfile} />
    </div>
  );
}

// A bookmarklet is only useful as a link you drag to the bookmarks bar, so this
// stays an <a> inside the menu item rather than becoming a click handler. React
// strips javascript: from href, so it's set on the node after mount — and the
// menu must not close on click, or the drag never starts.
function BookmarkletItem({
  code,
  children,
  ...props
}: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement> & { code: string }>) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.setAttribute('href', code);
  }, [code]);

  return (
    <Menu.Item className={styles.menuItem} closeOnClick={false} render={<a ref={ref} {...props} />}>
      {children}
    </Menu.Item>
  );
}
