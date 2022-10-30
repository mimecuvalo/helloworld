import { Button } from 'components';
import { F } from 'i18n';
import { useState } from 'react';

export default function KeepUnread({ keepUnreadCb }: { keepUnreadCb: (enabled: boolean) => void }) {
  const [enabled, setEnabled] = useState(false);

  const handleClick = async () => {
    keepUnreadCb(!enabled);
    setEnabled(!enabled);
  };

  return (
    <Button onClick={handleClick} sx={{ whiteSpace: 'nowrap' }}>
      <F defaultMessage="keep unread" />
    </Button>
  );
}
