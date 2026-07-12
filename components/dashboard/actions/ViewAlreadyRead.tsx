import { Menu } from '@base-ui/react/menu';
import { F } from 'i18n';
import type { HandleSetFeed, RemoteUser } from 'lib/remote-queries';
import styles from '../dashboard.module.css';

export default function ViewAlreadyRead({
  handleSetFeed,
  userRemote,
}: {
  handleSetFeed: HandleSetFeed;
  userRemote: RemoteUser;
}) {
  return (
    <Menu.Item className={styles.menuItem} onClick={() => handleSetFeed(userRemote, undefined, true)}>
      <F defaultMessage="view all items" />
    </Menu.Item>
  );
}
