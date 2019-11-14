import { createUseStyles } from 'react-jss';
import { defineMessages, F, useIntl } from '../../shared/i18n';
import HelpOutlineRoundedIcon from '@material-ui/icons/HelpOutlineRounded';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import React, { useState } from 'react';

const useStyles = createUseStyles({
  helpContainer: {
    display: 'inline-block',
  },

  helpIcon: {
    color: '#fff',
  },
});

const messages = defineMessages({
  help: { msg: 'Help' },
});

export default function Help() {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const styles = useStyles();

  const handleMenuOpenerClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleStyleguide = () => {
    handleClose();
    window.open('http://localhost:9001', 'styleguide');
  };

  const handleLanguage = () => {
    handleClose();
    window.location.href = '/?lang=fr';
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  function renderStyleguide() {
    // Conditionally compile this code. Should not appear in production.
    if (process.env.NODE_ENV === 'development') {
      return (
        <MenuItem key="styleguide" onClick={handleStyleguide}>
          Styleguide
        </MenuItem>
      );
    }

    return null;
  }

  const isOpen = Boolean(anchorEl);
  const helpAriaLabel = intl.formatMessage(messages.help);

  return (
    <div className={styles.helpContainer}>
      <IconButton
        aria-label={helpAriaLabel}
        aria-owns={isOpen ? 'help-menu' : undefined}
        aria-haspopup="true"
        onClick={handleMenuOpenerClick}
      >
        <HelpOutlineRoundedIcon className={styles.helpIcon} />
      </IconButton>
      <Menu
        id="help-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        {renderStyleguide()}
        <MenuItem key="language" onClick={handleLanguage}>
          <F msg="Test language alternative" />
        </MenuItem>
      </Menu>
    </div>
  );
}
