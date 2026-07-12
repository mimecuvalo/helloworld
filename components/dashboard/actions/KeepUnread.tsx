import { useState } from 'react';
import { defineMessages, useIntl } from 'i18n';
import styles from '../dashboard.module.css';

const messages = defineMessages({
  keepUnread: { defaultMessage: 'Keep unread' },
});

export default function KeepUnread({ keepUnreadCb }: { keepUnreadCb: (enabled: boolean) => void }) {
  const intl = useIntl();
  const [enabled, setEnabled] = useState(false);

  const handleClick = () => {
    keepUnreadCb(!enabled);
    setEnabled(!enabled);
  };

  return (
    <button
      type="button"
      className={`${styles.actionButton} ${enabled ? styles.actionActive : ''}`}
      onClick={handleClick}
      title={intl.formatMessage(messages.keepUnread)}
      aria-pressed={enabled}
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
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}
