import { LoopIcon } from '@radix-ui/react-icons';
import { defineMessages, useIntl } from 'i18n';
import { useEditor } from 'lib/editor-context';
import { reblog } from '../util';
import styles from '../dashboard.module.css';

const messages = defineMessages({
  reblog: { defaultMessage: 'Reblog' },
});

export default function Reblog({ contentRemote }: { contentRemote: { type: string; link: string } }) {
  const { editor } = useEditor();
  const intl = useIntl();
  const disabled = contentRemote.type === 'remote-comment';

  const handleClick = () => {
    if (!editor || disabled) return;
    reblog(editor, contentRemote.link, contentRemote.link);
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
