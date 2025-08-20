import { Button } from 'components';
import { useState } from 'react';
import { VisibilityOutlined } from '@mui/icons-material';
import { defineMessages, useIntl } from '@/i18n';

const messages = defineMessages({
  keepUnread: { defaultMessage: 'Keep unread' },
});

export default function KeepUnread({ keepUnreadCb }: { keepUnreadCb: (enabled: boolean) => void }) {
  const intl = useIntl();
  const [enabled, setEnabled] = useState(false);

  const handleClick = async () => {
    keepUnreadCb(!enabled);
    setEnabled(!enabled);
  };

  return (
    <Button onClick={handleClick} sx={{ whiteSpace: 'nowrap' }} title={intl.formatMessage(messages.keepUnread)}>
      <VisibilityOutlined />
    </Button>
  );
}
