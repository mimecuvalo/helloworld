import { IconButton, Menu } from 'components';
import { defineMessages, useIntl } from 'i18n';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import MarkAllFeedsAsRead from './actions/MarkAllFeedsAsRead';
import { useState } from 'react';

const messages = defineMessages({
  menu: { defaultMessage: 'user options' },
});

export default function FollowingAllMenu() {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpenerClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isOpen = Boolean(anchorEl);
  const menuAriaLabel = intl.formatMessage(messages.menu);
  const id = `following-all-menu`;

  return (
    <>
      <IconButton
        aria-label={menuAriaLabel}
        aria-owns={isOpen ? id : undefined}
        aria-haspopup="true"
        onClick={handleMenuOpenerClick}
        size="large"
      >
        <ArrowDropDownIcon />
      </IconButton>
      <Menu id={id} anchorEl={anchorEl} open={isOpen} onClose={handleClose} transitionDuration={0}>
        <MarkAllFeedsAsRead key="read" handleClose={handleClose} />
      </Menu>
    </>
  );
}
