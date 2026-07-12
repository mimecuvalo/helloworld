import { Menu } from '@base-ui/react/menu';
import { F, defineMessages, useIntl } from 'i18n';
import type { HandleSetFeed, RemoteUser } from 'lib/remote-queries';
import MarkAllAsRead from './actions/MarkAllAsRead';
import Sort from './actions/Sort';
import UnfollowFeed from './actions/UnfollowFeed';
import ViewAlreadyRead from './actions/ViewAlreadyRead';
import styles from './dashboard.module.css';

const messages = defineMessages({
  menu: { defaultMessage: 'user options' },
});

export default function FollowingMenu({
  userRemote,
  handleSetFeed,
}: {
  userRemote: RemoteUser;
  handleSetFeed: HandleSetFeed;
}) {
  const intl = useIntl();
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.menuTrigger} aria-label={intl.formatMessage(messages.menu)}>
        ▾
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} side="bottom" align="end">
          <Menu.Popup className={styles.menuPopup}>
            <Menu.Item
              className={styles.menuItem}
              onClick={() => window.open(userRemote.profileUrl, userRemote.profileUrl, 'noopener,noreferrer')}
            >
              <F defaultMessage="visit" />
            </Menu.Item>
            <MarkAllAsRead userRemote={userRemote} />
            <Sort userRemote={userRemote} handleSetFeed={handleSetFeed} />
            <ViewAlreadyRead userRemote={userRemote} handleSetFeed={handleSetFeed} />
            <UnfollowFeed userRemote={userRemote} handleSetFeed={handleSetFeed} />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
