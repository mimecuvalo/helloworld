import { defineMessages, useIntl } from 'i18n';
import { useEditor } from 'lib/editor-context';
import styles from '../dashboard.module.css';

const messages = defineMessages({
  reply: { defaultMessage: 'replying to' },
  replyTo: { defaultMessage: 'Reply to' },
});

export default function Reply({ contentRemote }: { contentRemote: { type: string; link: string } }) {
  const { editor } = useEditor();
  const intl = useIntl();

  const handleClick = () => {
    const { type, link } = contentRemote;
    if (type === 'remote-comment') {
      window.open(link, link, 'noopener,noreferrer');
      return;
    }
    editor?.commands.insertContent(`${intl.formatMessage(messages.reply)} > ${link}`);
  };

  return (
    <button
      type="button"
      className={styles.actionButton}
      onClick={handleClick}
      title={intl.formatMessage(messages.replyTo)}
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
        <path d="M9 17l-5-5 5-5M4 12h11a5 5 0 0 1 5 5v2" />
      </svg>
    </button>
  );
}
