import { Menu } from '@base-ui/react/menu';
import { F, defineMessages, useIntl } from 'i18n';
import type { HandleSetFeed, RemoteUser } from 'lib/remote-queries';
import NewFeed from './actions/NewFeed';
import styles from './dashboard.module.css';

const messages = defineMessages({
  menu: { defaultMessage: 'follower options' },
});

export default function FollowerMenu({
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
              onClick={() => window.open(userRemote.profileUrl, userRemote.profileUrl)}
            >
              <F defaultMessage="visit" />
            </Menu.Item>
            {!userRemote.following ? (
              <NewFeed handleSetFeed={handleSetFeed} isButton profileUrl={userRemote.profileUrl} />
            ) : null}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
