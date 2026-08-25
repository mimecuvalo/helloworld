import { LoopIcon } from '@radix-ui/react-icons';
import { useMutation } from '@tanstack/react-query';
import { defineMessages, useIntl } from 'i18n';
import { useEditor } from 'lib/editor-context';
import { rpc } from 'lib/rpc';
import { reblog } from '../util';
import styles from '../dashboard.module.css';

const messages = defineMessages({
  reblog: { defaultMessage: 'Reblog' },
});

export default function Reblog({
  contentRemote,
}: {
  contentRemote: { type: string; link: string; postId?: string; fromUsername?: string | null };
}) {
  const { editor } = useEditor();
  const intl = useIntl();
  const disabled = contentRemote.type === 'remote-comment';

  // An at:// postId means the item came from Bluesky, where a reblog can be a
  // real repost instead of only a quote in the editor.
  const isAtproto = !!contentRemote.postId?.startsWith('at://');
  const repost = useMutation({
    mutationFn: () =>
      rpc.api['content-remote'].repost.$post({
        json: {
          fromUsername: contentRemote.fromUsername || '',
          postId: contentRemote.postId || '',
          isRepost: true,
        },
      }),
  });

  const handleClick = () => {
    if (disabled) return;
    if (isAtproto) repost.mutate();
    if (editor) reblog(editor, contentRemote.link, contentRemote.link);
  };

  return (
    <button
      type="button"
      className={styles.actionButton}
      onClick={handleClick}
      disabled={disabled}
      title={intl.formatMessage(messages.reblog)}
    >
      <LoopIcon width={18} height={18} aria-hidden="true" />
    </button>
  );
}
