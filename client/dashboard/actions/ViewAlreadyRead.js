import { F } from '../../../shared/i18n';
import MenuItem from '@material-ui/core/MenuItem';
import React from 'react';

export default function ViewAlreadyRead({ handleClose, handleSetFeed, userRemote }) {
  const handleClick = async () => {
    handleClose();

    handleSetFeed(userRemote, undefined /* query */, true /* all items */);
  };

  return (
    <MenuItem onClick={handleClick}>
      <F msg="view all items" />
    </MenuItem>
  );
}
