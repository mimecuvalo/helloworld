import { Menu } from '@base-ui/react/menu';
import { defineMessages, useIntl } from 'i18n';
import MarkAllFeedsAsRead from './actions/MarkAllFeedsAsRead';
import styles from './dashboard.module.css';

const messages = defineMessages({
  menu: { defaultMessage: 'user options' },
});

export default function FollowingAllMenu() {
  const intl = useIntl();
  return (
    <Menu.Root>
      <Menu.Trigger className={styles.menuTrigger} aria-label={intl.formatMessage(messages.menu)}>
        ▾
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} side="bottom" align="end">
          <Menu.Popup className={styles.menuPopup}>
            <MarkAllFeedsAsRead />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
