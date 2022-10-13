import { F, defineMessages, useIntl } from 'i18n';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import IconButton from '@mui/material/IconButton';
import MarkAllAsRead from './actions/MarkAllAsRead';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Sort from './actions/Sort';
import UnfollowFeed from './actions/UnfollowFeed';
import ViewAlreadyRead from './actions/ViewAlreadyRead';
import { useState } from 'react';

const messages = defineMessages({
  menu: { defaultMessage: 'user options' },
});

export default function FollowingMenu({
  userRemote,
  handleSetFeed,
}: {
  userRemote: UserRemote;
  handleSetFeed: (userRemote: UserRemote) => void;
}) {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpenerClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleVisit = () => {
    handleClose();
    window.open(userRemote.profile_url, userRemote.profile_url, 'noopener,noreferrer');
  };

  const isOpen = Boolean(anchorEl);
  const menuAriaLabel = intl.formatMessage(messages.menu);
  const id = `following-menu-${userRemote.profile_url}`;

  return (
    <>
      <IconButton
        className={styles.menu}
        aria-label={menuAriaLabel}
        aria-owns={isOpen ? id : undefined}
        aria-haspopup="true"
        onClick={handleMenuOpenerClick}
        size="large"
      >
        <ArrowDropDownIcon />
      </IconButton>
      <Menu id={id} anchorEl={anchorEl} open={isOpen} onClose={handleClose} transitionDuration={0}>
        <MenuItem key="visit" onClick={handleVisit}>
          <F defaultMessage="visit" />
        </MenuItem>
        <MarkAllAsRead key="read" handleClose={handleClose} userRemote={userRemote} />
        <Sort key="sort" handleClose={handleClose} userRemote={userRemote} handleSetFeed={handleSetFeed} />
        <ViewAlreadyRead
          key="alreadyread"
          handleClose={handleClose}
          userRemote={userRemote}
          handleSetFeed={handleSetFeed}
        />
        <UnfollowFeed key="unfollow" handleClose={handleClose} userRemote={userRemote} handleSetFeed={handleSetFeed} />
      </Menu>
    </>
  );
}
