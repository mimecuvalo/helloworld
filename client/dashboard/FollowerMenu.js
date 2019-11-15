import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { defineMessages, F, useIntl } from '../../shared/i18n';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import NewFeed from './actions/NewFeed';
import React, { useState } from 'react';
import useStyles from './remoteUsersStyles';

const messages = defineMessages({
  menu: { msg: 'follower options' },
});

export default function FollowerMenu(props) {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const styles = useStyles();

  const handleMenuOpenerClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSetFeed = userRemote => {
    handleClose();
    props.handleSetFeed(userRemote);
  };

  const handleVisit = () => {
    handleClose();
    window.open(props.userRemote.profile_url, props.userRemote.profile_url);
  };

  const isOpen = Boolean(anchorEl);
  const { userRemote } = props;
  const menuAriaLabel = intl.formatMessage(messages.menu);
  const id = `follower-menu-${userRemote.profile_url}`;
  const { profile_url, following } = userRemote;

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
          <F msg="visit" />
        </MenuItem>
        {!following ? <NewFeed handleSetFeed={handleSetFeed} isButton={true} profileUrl={profile_url} /> : null}
      </Menu>
    </>
  );
}
