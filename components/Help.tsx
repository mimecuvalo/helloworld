import {
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  SwipeableDrawer,
  Typography,
} from '@mui/material';
import { F, defineMessages, useIntl } from 'i18n';
import { MouseEvent, useEffect, useState } from 'react';
import { styled, useTheme } from '@mui/material';

import { $Experiment } from 'app/experiments';
import Cookies from 'js-cookie';
import { Help as HelpIcon } from '@mui/icons-material';
import Link from './Link';

const HelpContainer = styled('div')`
  display: inline-block;
`;

const messages = defineMessages({
  help: { defaultMessage: 'Help' },
});

// const EXPERIMENTS_QUERY = gql`
//   {
//     experiments @client {
//       name
//     }
//   }
// `;

export default function Help() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>();
  const [experiments, setExperiments] = useState<$Experiment[]>([]);
  const [isExperimentsOpen, setIsExperimentsOpen] = useState(false);
  const intl = useIntl();
  const theme = useTheme();
  //const { data } = useQuery(EXPERIMENTS_QUERY);
  const enabledExperiments: EnabledExperiment[] = []; //data?.experiments?.map((exp: EnabledExperiment) => exp.name) || [];

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/admin/experiments');
      const json = await response.json();
      setExperiments(json.experiments ?? {});
    }
    fetchData();
  }, [setExperiments]);

  const allExperiments = Object.keys(experiments).map((name: string) => ({
    name,
    // @ts-ignore fix up later
    ...experiments[name],
  }));
  const cookieExperimentOverrides = JSON.parse(Cookies.get('experiments') || '{}');

  const handleMenuOpenerClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAdmin = () => {
    handleClose();
    window.location.href = '/admin';
  };

  const handleExperiments = () => {
    handleClose();
    setIsExperimentsOpen(true);
  };

  const handleStyleguide = () => {
    handleClose();
    window.open('http://localhost:9001', 'styleguide');
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExperimentChange = (name: string) => {
    cookieExperimentOverrides[name] = !cookieExperimentOverrides[name];
    Cookies.set('experiments', JSON.stringify(cookieExperimentOverrides));
    window.location.reload();
  };

  const renderStyleguide = () => {
    // Conditionally compile this code. Should not appear in production.
    if (process.env.NODE_ENV === 'development') {
      return (
        <MenuItem key="styleguide" onClick={handleStyleguide}>
          Styleguide
        </MenuItem>
      );
    }

    return null;
  };

  const isOpen = Boolean(anchorEl);
  const helpAriaLabel = intl.formatMessage(messages.help);

  return (
    <HelpContainer>
      <IconButton
        aria-label={helpAriaLabel}
        aria-owns={isOpen ? 'help-menu' : undefined}
        aria-haspopup="true"
        onClick={handleMenuOpenerClick}
        size="large"
        sx={{ color: theme.palette.primary.light }}
      >
        <HelpIcon />
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
          <F defaultMessage="Admin" />
        </MenuItem>
        <MenuItem key="experiments" onClick={handleExperiments}>
          <F defaultMessage="Experiments" />
        </MenuItem>
        {renderStyleguide()}
        <MenuItem key="language">
          <Link href="/" locale="fr" sx={{ textDecoration: 'none !important', color: '#000' }}>
            <F defaultMessage="Test language alternative" />
          </Link>
        </MenuItem>
      </Menu>

      <SwipeableDrawer
        anchor="right"
        open={isExperimentsOpen}
        onClose={() => setIsExperimentsOpen(false)}
        onOpen={() => setIsExperimentsOpen(true)}
      >
        <Typography variant="h1" style={{ padding: `0 ${theme.spacing(1)}` }}>
          Experiments
        </Typography>
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
    </HelpContainer>
  );
}
