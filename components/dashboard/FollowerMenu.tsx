import { F, defineMessages, useIntl } from 'i18n';
import { IconButton, Menu, MenuItem } from 'components';
import { MouseEvent, useState } from 'react';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import NewFeed from './actions/NewFeed';

const messages = defineMessages({
  menu: { defaultMessage: 'follower options' },
});

export default function FollowerMenu({
  userRemote,
  handleSetFeed,
}: {
  userRemote: UserRemote;
  handleSetFeed: (userRemote: UserRemote) => void;
}) {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpenerClick = (event: MouseEvent) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onSetFeed = (userRemote: UserRemote) => {
    handleClose();
    handleSetFeed(userRemote);
  };

  const handleVisit = () => {
    handleClose();
    window.open(userRemote.profile_url, userRemote.profile_url);
  };

  const isOpen = Boolean(anchorEl);
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
        size="large"
      >
        <ArrowDropDownIcon />
      </IconButton>
      <Menu id={id} anchorEl={anchorEl} open={isOpen} onClose={handleClose} transitionDuration={0}>
        <MenuItem key="visit" onClick={handleVisit}>
          <F defaultMessage="visit" />
        </MenuItem>
        {!following ? <NewFeed handleSetFeed={onSetFeed} isButton={true} profileUrl={profile_url} /> : null}
      </Menu>
    </>
  );
}
