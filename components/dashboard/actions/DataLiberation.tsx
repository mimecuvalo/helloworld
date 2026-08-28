import { useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import { useMutation } from '@tanstack/react-query';
import { F } from 'i18n';
import { rpc } from 'lib/rpc';
import styles from '../dashboard.module.css';

// Takes your data out of here: a zip of the database rows that are yours, as
// plain JSON. Deliberately a fetch rather than a plain download link — the
// server assembles the archive on the fly and it can take a moment, and a bare
// <a download> gives no way to say "working on it" or to surface a failure.
export default function DataLiberation() {
  const [error, setError] = useState('');

  const exportData = useMutation({
    mutationFn: async () => {
      const response = await rpc.api.users.export.$get();
      if (!response.ok) {
        throw new Error(((await response.json()) as { error?: string }).error || 'Could not build the export.');
      }

      // Content-Disposition doesn't reach us through fetch, so the filename the
      // route chose comes back out of the header we can read.
      const disposition = response.headers.get('content-disposition') || '';
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || 'export.zip';

      const url = URL.createObjectURL(await response.blob());
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    onSuccess: () => setError(''),
    onError: (ex: Error) => setError(ex.message),
  });

  return (
    <Menu.Item
      className={styles.menuItem}
      closeOnClick={false}
      disabled={exportData.isPending}
      onClick={() => exportData.mutate()}
    >
      {exportData.isPending ? (
        <F defaultMessage="data liberation — packing…" />
      ) : (
        <F defaultMessage="data liberation" />
      )}
      {error ? <span className={styles.menuItemError}>{error}</span> : null}
    </Menu.Item>
  );
}
