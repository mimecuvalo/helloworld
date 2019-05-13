import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { defineMessages, injectIntl } from '../../shared/i18n';
import IconButton from '@material-ui/core/IconButton';
import MarkAllFeedsAsRead from './actions/MarkAllFeedsAsRead';
import Menu from '@material-ui/core/Menu';
import React, { PureComponent } from 'react';
import styles from './RemoteUsers.module.css';

const messages = defineMessages({
  menu: { msg: 'user options' },
});

@injectIntl
class FollowingAllMenu extends PureComponent {
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

  render() {
    const { anchorEl } = this.state;
    const isOpen = Boolean(anchorEl);
    const menuAriaLabel = this.props.intl.formatMessage(messages.menu);
    const id = `following-all-menu`;

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
          <MarkAllFeedsAsRead key="read" handleClose={this.handleClose} />
        </Menu>
      </>
    );
  }
}
export default FollowingAllMenu;
