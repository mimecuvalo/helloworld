import { Menu } from '@base-ui/react/menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { F } from 'i18n';
import { rpc } from 'lib/rpc';
import styles from '../dashboard.module.css';

export default function MarkAllFeedsAsRead() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => rpc.api['content-remote']['mark-all-read'].$post().then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-counts'] });
      queryClient.invalidateQueries({ queryKey: ['total-counts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-paginated'] });
    },
  });

  return (
    <Menu.Item className={styles.menuItem} onClick={() => mutation.mutate()}>
      <F defaultMessage="mark all feeds as read" />
    </Menu.Item>
  );
}
