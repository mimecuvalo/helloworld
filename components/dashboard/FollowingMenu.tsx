import { F, defineMessages, useIntl } from 'shared/util/i18n';

import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import IconButton from '@material-ui/core/IconButton';
import MarkAllAsRead from './actions/MarkAllAsRead';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Sort from './actions/Sort';
import UnfollowFeed from './actions/UnfollowFeed';
import ViewAlreadyRead from './actions/ViewAlreadyRead';
import { useState } from 'react';
import useStyles from './remoteUsersStyles';

const messages = defineMessages({
  menu: { defaultMessage: 'user options' },
});

export default function FollowingMenu(props) {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const styles = useStyles();

  const handleMenuOpenerClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleVisit = () => {
    handleClose();
    window.open(props.userRemote.profile_url, props.userRemote.profile_url, 'noopener,noreferrer');
  };

  const isOpen = Boolean(anchorEl);
  const menuAriaLabel = intl.formatMessage(messages.menu);
  const id = `following-menu-${props.userRemote.profile_url}`;

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
        <MenuItem key="visit" onClick={handleVisit}>
          <F defaultMessage="visit" />
        </MenuItem>
        <MarkAllAsRead key="read" handleClose={handleClose} userRemote={props.userRemote} />
        <Sort key="sort" handleClose={handleClose} userRemote={props.userRemote} handleSetFeed={props.handleSetFeed} />
        <ViewAlreadyRead
          key="alreadyread"
          handleClose={handleClose}
          userRemote={props.userRemote}
          handleSetFeed={props.handleSetFeed}
        />
        <UnfollowFeed
          key="unfollow"
          handleClose={handleClose}
          userRemote={props.userRemote}
          handleSetFeed={props.handleSetFeed}
        />
      </Menu>
    </>
  );
}
