import { defineMessages, F, injectIntl } from '../../shared/i18n';
import HelpOutlineRoundedIcon from '@material-ui/icons/HelpOutlineRounded';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import React, { PureComponent } from 'react';
import styles from './Help.module.css';

const messages = defineMessages({
  help: { msg: 'Help' },
});

class Help extends PureComponent {
  constructor() {
    super();

    this.state = {
      anchorEl: null,
    };
  }

  handleMenuOpenerClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleStyleguide = () => {
    this.handleClose();
    window.open('http://localhost:9001', 'styleguide');
  };

  handleLanguage = () => {
    this.handleClose();
    window.location.href = '/?lang=fr';
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  renderStyleguide() {
    // Conditionally compile this code. Should not appear in production.
    if (process.env.NODE_ENV === 'development') {
      return (
        <MenuItem key="styleguide" onClick={this.handleStyleguide}>
          Styleguide
        </MenuItem>
      );
    }

    return null;
  }

  render() {
    const { anchorEl } = this.state;
    const isOpen = Boolean(anchorEl);
    const helpAriaLabel = this.props.intl.formatMessage(messages.help);

    return (
      <div className={styles.helpContainer}>
        <IconButton
          aria-label={helpAriaLabel}
          aria-owns={isOpen ? 'help-menu' : undefined}
          aria-haspopup="true"
          onClick={this.handleMenuOpenerClick}
        >
          <HelpOutlineRoundedIcon className={styles.helpIcon} />
        </IconButton>
        <Menu
          id="help-menu"
          anchorEl={anchorEl}
          open={isOpen}
          onClose={this.handleClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          {this.renderStyleguide()}
          <MenuItem key="language" onClick={this.handleLanguage}>
            <F msg="Test language alternative" />
          </MenuItem>
        </Menu>
      </div>
    );
  }
}

export default injectIntl(Help);
