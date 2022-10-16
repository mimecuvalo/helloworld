import { F, defineMessages, useIntl } from 'i18n';
import { MouseEvent, useState } from 'react';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import IconButton from '@mui/material/IconButton';
import MarkAllAsRead from './actions/MarkAllAsRead';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Sort from './actions/Sort';
import UnfollowFeed from './actions/UnfollowFeed';
import { UserRemotePublic } from 'data/graphql-generated';
import ViewAlreadyRead from './actions/ViewAlreadyRead';

const messages = defineMessages({
  menu: { defaultMessage: 'user options' },
});

export default function FollowingMenu({
  userRemote,
  handleSetFeed,
}: {
  userRemote: UserRemotePublic;
  handleSetFeed: (userRemote: UserRemotePublic | string, search?: string) => void;
}) {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState<Element | null>();

  const handleMenuOpenerClick = (event: MouseEvent) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleVisit = () => {
    handleClose();
    window.open(userRemote.profileUrl, userRemote.profileUrl, 'noopener,noreferrer');
  };

  const isOpen = Boolean(anchorEl);
  const menuAriaLabel = intl.formatMessage(messages.menu);
  const id = `following-menu-${userRemote.profileUrl}`;

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
