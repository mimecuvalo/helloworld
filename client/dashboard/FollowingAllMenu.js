import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { defineMessages, useIntl } from '../../shared/i18n';
import IconButton from '@material-ui/core/IconButton';
import MarkAllFeedsAsRead from './actions/MarkAllFeedsAsRead';
import Menu from '@material-ui/core/Menu';
import React, { useState } from 'react';
import useStyles from './remoteUsersStyles';

const messages = defineMessages({
  menu: { msg: 'user options' },
});

export default function FollowingAllMenu(props) {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const styles = useStyles();

  const handleMenuOpenerClick = event => {
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
        className={styles.menu}
        aria-label={menuAriaLabel}
        aria-owns={isOpen ? id : undefined}
        aria-haspopup="true"
        onClick={handleMenuOpenerClick}
      >
        <ArrowDropDownIcon />
      </IconButton>
      <Menu id={id} anchorEl={anchorEl} open={isOpen} onClose={handleClose} transitionDuration={0}>
        <MarkAllFeedsAsRead key="read" handleClose={handleClose} />
      </Menu>
    </>
  );
}
