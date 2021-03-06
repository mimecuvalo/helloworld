import classNames from 'classnames';
import { F } from '../../../shared/i18n';
import React, { useState } from 'react';
import useStyles from './actionsStyles';

export default function KeepUnread({ keepUnreadCb }) {
  const [enabled, setEnabled] = useState(false);
  const styles = useStyles();

  const handleClick = async evt => {
    keepUnreadCb(!enabled);
    setEnabled(!enabled);
  };

  return (
    <button onClick={handleClick} className={classNames('hw-button-link', { [styles.enabled]: enabled })}>
      <F msg="keep unread" />
    </button>
  );
}
