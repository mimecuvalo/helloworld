import { MouseEvent, useState } from 'react';

import { F } from 'i18n';

export default function KeepUnread({ keepUnreadCb }: { keepUnreadCb: (enabled: boolean) => void }) {
  const [enabled, setEnabled] = useState(false);

  const handleClick = async (evt: MouseEvent) => {
    keepUnreadCb(!enabled);
    setEnabled(!enabled);
  };

  return (
    <button onClick={handleClick} disabled={!enabled} className="hw-button-link">
      <F defaultMessage="keep unread" />
    </button>
  );
}
