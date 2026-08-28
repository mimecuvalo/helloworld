import { Menu } from '@base-ui/react/menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { F } from 'i18n';
import { rpc } from 'lib/rpc';
import type { RemoteUser } from 'lib/remote-queries';
import styles from '../dashboard.module.css';

export default function MarkAllAsRead({ userRemote }: { userRemote: RemoteUser }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      rpc.api['content-remote']['mark-feed-read'].$post({ json: { fromUsername: userRemote.profileUrl } }).then((r) => {
        if (!r.ok) throw new Error('mark-feed-read failed');
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-paginated'] });
    },
  });

  return (
    <Menu.Item className={styles.menuItem} onClick={() => mutation.mutate()}>
      <F defaultMessage="mark all as read" />
    </Menu.Item>
  );
}
