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
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4m14-2v2a4 4 0 0 1-4 4H3" />
      </svg>
    </button>
  );
}
