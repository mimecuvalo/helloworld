import { F } from 'shared/util/i18n';
import classNames from 'classnames';
import { useState } from 'react';
import useStyles from './actionsStyles';

export default function KeepUnread({ keepUnreadCb }) {
  const [enabled, setEnabled] = useState(false);
  const styles = useStyles();

  const handleClick = async (evt) => {
    keepUnreadCb(!enabled);
    setEnabled(!enabled);
  };

  return (
    <button onClick={handleClick} className={classNames('hw-button-link', { [styles.enabled]: enabled })}>
      <F defaultMessage="keep unread" />
    </button>
  );
}
