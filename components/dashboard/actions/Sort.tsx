import { Menu } from '@base-ui/react/menu';
import { useMutation } from '@tanstack/react-query';
import { F } from 'i18n';
import { rpc } from 'lib/rpc';
import type { HandleSetFeed, RemoteUser } from 'lib/remote-queries';
import styles from '../dashboard.module.css';

export default function Sort({ handleSetFeed, userRemote }: { handleSetFeed: HandleSetFeed; userRemote: RemoteUser }) {
  const mutation = useMutation({
    mutationFn: () =>
      rpc.api['users-remote']['toggle-sort-feed']
        .$post({ json: { profileUrl: userRemote.profileUrl, currentSortType: userRemote.sortType || '' } })
        .then((r) => r.json() as Promise<{ profileUrl: string; sortType: string }>),
  });

  const handleClick = async () => {
    const result = await mutation.mutateAsync();
    handleSetFeed({ ...userRemote, sortType: result.sortType }, `?sort=${userRemote.sortType}`);
  };

  return (
    <Menu.Item className={styles.menuItem} onClick={handleClick}>
      {userRemote.sortType === 'oldest' ? <F defaultMessage="sort by newest" /> : <F defaultMessage="sort by oldest" />}
    </Menu.Item>
  );
}
