import { Button, Menu } from 'components';
import { MouseEvent, useState } from 'react';
import { defineMessages, useIntl } from 'i18n';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import MarkAllFeedsAsRead from './actions/MarkAllFeedsAsRead';

const messages = defineMessages({
  menu: { defaultMessage: 'user options' },
});

export default function FollowingAllMenu() {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const handleMenuOpenerClick = (event: MouseEvent) => {
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
      <Button
        aria-label={menuAriaLabel}
        aria-owns={isOpen ? id : undefined}
        aria-haspopup="true"
        onClick={handleMenuOpenerClick}
        sx={{ minWidth: 0 }}
      >
        <ArrowDropDownIcon />
      </Button>
      <Menu id={id} anchorEl={anchorEl} open={isOpen} onClose={handleClose} transitionDuration={0}>
        <MarkAllFeedsAsRead key="read" handleClose={handleClose} />
      </Menu>
    </>
  );
}
