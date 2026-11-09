import { useState } from 'react';
import { EyeOpenIcon } from '@radix-ui/react-icons';
import { defineMessages, useIntl } from 'i18n';
import styles from '../dashboard.module.css';
import Tooltip from 'components/Tooltip';

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
    <Tooltip label={intl.formatMessage(messages.keepUnread)}>
      <button
        type="button"
        className={`${styles.actionButton} ${enabled ? styles.actionActive : ''}`}
        onClick={handleClick}
        aria-label={intl.formatMessage(messages.keepUnread)}
        aria-pressed={enabled}
      >
        <EyeOpenIcon width={18} height={18} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
