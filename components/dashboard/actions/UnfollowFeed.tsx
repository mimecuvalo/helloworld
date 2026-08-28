import { Menu } from '@base-ui/react/menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { F } from 'i18n';
import { rpc } from 'lib/rpc';
import type { HandleSetFeed, RemoteUser } from 'lib/remote-queries';
import styles from '../dashboard.module.css';

export default function UnfollowFeed({
  handleSetFeed,
  userRemote,
}: {
  handleSetFeed: HandleSetFeed;
  userRemote: RemoteUser;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      rpc.api['users-remote'].unfollow.$post({ json: { profileUrl: userRemote.profileUrl } }).then((r) => {
        if (!r.ok) throw new Error('unfollow failed');
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relations'] });
      queryClient.invalidateQueries({ queryKey: ['counts'] });
    },
  });

  const handleClick = async () => {
    await mutation.mutateAsync();
    handleSetFeed('');
  };

  return (
    <Menu.Item className={styles.menuItem} onClick={handleClick}>
      <F defaultMessage="unfollow" />
    </Menu.Item>
  );
}
