import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { TrashIcon } from '@radix-ui/react-icons';
import { defineMessages, useIntl } from 'i18n';
import { rpc } from 'lib/rpc';
import styles from '../dashboard.module.css';

type DeletableRemote = {
  deleted?: boolean | null;
  fromUsername?: string | null;
  localContentName?: string | null;
  postId: string;
  type: string;
};

const messages = defineMessages({
  delete: { defaultMessage: 'Delete' },
});

export default function Delete({ contentRemote }: { contentRemote: DeletableRemote }) {
  const intl = useIntl();
  const [deleted, setDeleted] = useState(!!contentRemote.deleted);

  const mutation = useMutation({
    mutationFn: (deletedNext: boolean) =>
      rpc.api['content-remote'].delete
        .$post({
          json: {
            fromUsername: contentRemote.fromUsername || '',
            localContentName: contentRemote.localContentName || '',
            postId: contentRemote.postId,
            type: contentRemote.type,
            deleted: deletedNext,
          },
        })
        .then((r) => {
          if (!r.ok) throw new Error('delete failed');
          return r.json();
        }),
  });

  const handleClick = () => {
    const next = !deleted;
    setDeleted(next);
    mutation.mutate(next, { onError: () => setDeleted(!next) });
  };

  return (
    <button
      type="button"
      className={`${styles.actionButton} ${styles.actionDanger}`}
      onClick={handleClick}
      title={intl.formatMessage(messages.delete)}
      aria-pressed={deleted}
    >
      <TrashIcon width={18} height={18} aria-hidden="true" />
    </button>
  );
}
