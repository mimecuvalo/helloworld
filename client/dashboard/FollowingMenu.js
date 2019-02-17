import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { defineMessages, F, injectIntl } from '../../shared/i18n';
import IconButton from '@material-ui/core/IconButton';
import MarkAllAsRead from './actions/MarkAllAsRead';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import React, { Component } from 'react';
import Sort from './actions/Sort';
import styles from './RemoteUsers.module.css';
import UnfollowFeed from './actions/UnfollowFeed';

const messages = defineMessages({
  menu: { msg: 'user options' },
});

class FollowingMenu extends Component {
  constructor() {
    super();

    this.state = {
      anchorEl: null,
    };
  }

  handleMenuOpenerClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleVisit = () => {
    this.handleClose();
    window.open(this.props.userRemote.profile_url, this.props.userRemote.profile_url);
  };

  render() {
    const { anchorEl } = this.state;
    const isOpen = Boolean(anchorEl);
    const menuAriaLabel = this.props.intl.formatMessage(messages.menu);
    const id = `following-menu-${this.props.userRemote.profile_url}`;

    return (
      <>
        <IconButton
          className={styles.menu}
          aria-label={menuAriaLabel}
          aria-owns={isOpen ? id : undefined}
          aria-haspopup="true"
          onClick={this.handleMenuOpenerClick}
        >
          <ArrowDropDownIcon />
        </IconButton>
        <Menu id={id} anchorEl={anchorEl} open={isOpen} onClose={this.handleClose} transitionDuration={0}>
          <MenuItem key="visit" onClick={this.handleVisit}>
            <F msg="visit" />
          </MenuItem>
          <MarkAllAsRead key="read" handleClose={this.handleClose} userRemote={this.props.userRemote} />
          <Sort
            key="sort"
            handleClose={this.handleClose}
            userRemote={this.props.userRemote}
            handleSetFeed={this.props.handleSetFeed}
          />
          <UnfollowFeed
            key="unfollow"
            handleClose={this.handleClose}
            userRemote={this.props.userRemote}
            handleSetFeed={this.props.handleSetFeed}
          />
        </Menu>
      </>
    );
  }
}
export default injectIntl(FollowingMenu);
