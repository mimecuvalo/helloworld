import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { defineMessages, F, injectIntl } from '../../shared/i18n';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import NewFeed from './actions/NewFeed';
import React, { PureComponent } from 'react';
import styles from './RemoteUsers.module.css';

const messages = defineMessages({
  menu: { msg: 'follower options' },
});

@injectIntl
class FollowerMenu extends PureComponent {
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

  handleSetFeed = userRemote => {
    this.handleClose();
    this.props.handleSetFeed(userRemote);
  };

  handleVisit = () => {
    this.handleClose();
    window.open(this.props.userRemote.profile_url, this.props.userRemote.profile_url);
  };

  render() {
    const { anchorEl } = this.state;
    const isOpen = Boolean(anchorEl);
    const { userRemote } = this.props;
    const menuAriaLabel = this.props.intl.formatMessage(messages.menu);
    const id = `follower-menu-${userRemote.profile_url}`;
    const { profile_url, following } = userRemote;

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
          {!following ? <NewFeed handleSetFeed={this.handleSetFeed} isButton={true} profileUrl={profile_url} /> : null}
        </Menu>
      </>
    );
  }
}
export default FollowerMenu;
