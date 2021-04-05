import Checkbox from '@material-ui/core/Checkbox';
import Cookies from 'js-cookie';
import { createUseStyles } from 'react-jss';
import { defineMessages, F, useIntl } from 'react-intl-wrapper';
import gql from 'graphql-tag';
import HelpOutlineRoundedIcon from '@material-ui/icons/HelpOutlineRounded';
import IconButton from '@material-ui/core/IconButton';
import { List, ListItem, ListItemText } from '@material-ui/core';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { useEffect, useState } from 'react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import { useQuery } from '@apollo/client';

const useStyles = createUseStyles({
  helpContainer: {
    display: 'inline-block',
  },
});

const messages = defineMessages({
  help: { msg: 'Help' },
});

const EXPERIMENTS_QUERY = gql`
  {
    experiments @client {
      name
    }
  }
`;

export default function Help() {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const [experiments, setExperiments] = useState({});
  const [isExperimentsOpen, setIsExperimentsOpen] = useState(false);
  const styles = useStyles();
  const { data } = useQuery(EXPERIMENTS_QUERY);
  const enabledExperiments = data?.experiments?.map((exp) => exp.name);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/admin/experiments');
      const json = await response.json();
      setExperiments(json.experiments);
    }
    fetchData();
  }, [setExperiments]);

  const allExperiments = Object.keys(experiments).map((name) => ({ name, ...experiments[name] }));
  const cookieExperimentOverrides = Cookies.get('experiments') || {};

  const handleExperiments = () => {
    handleClose();
    setIsExperimentsOpen(true);
  };

  const handleExperimentChange = (name) => {
    cookieExperimentOverrides[name] = !enabledExperiments[name];
    Cookies.set('experiments', cookieExperimentOverrides);
    window.location.reload();
  };

  const handleAdmin = () => {
    handleClose();
    window.location.href = '/admin';
  };

  const handleMenuOpenerClick = (event) => {
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
        <HelpOutlineRoundedIcon />
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
        <MenuItem key="admin" onClick={handleAdmin}>
          <F msg="Admin" />
        </MenuItem>
        <MenuItem key="experiments" onClick={handleExperiments}>
          <F msg="Experiments" />
        </MenuItem>
        {renderStyleguide()}
        <MenuItem key="language" onClick={handleLanguage}>
          <F msg="Test language alternative" />
        </MenuItem>
      </Menu>

      <SwipeableDrawer
        anchor="right"
        open={isExperimentsOpen}
        onClose={() => setIsExperimentsOpen(false)}
        onOpen={() => setIsExperimentsOpen(true)}
      >
        <h1 style={{ padding: '0 10px' }}>Experiments</h1>
        <List>
          {allExperiments.map((exp) => (
            <ListItem button key={exp.name}>
              <Checkbox
                checked={enabledExperiments.includes(exp.name)}
                onChange={() => handleExperimentChange(exp.name)}
                value={`experiment-${exp.name}`}
                color="primary"
              />
              <ListItemText primary={exp.name} />
            </ListItem>
          ))}
        </List>
      </SwipeableDrawer>
    </div>
  );
}
