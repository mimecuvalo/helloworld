import { F, defineMessages, useIntl } from 'i18n';
import { IconButton, Menu, MenuItem } from 'components';
import { MouseEvent, useState } from 'react';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import NewFeed from './actions/NewFeed';
import { UserRemotePublic } from 'data/graphql-generated';

const messages = defineMessages({
  menu: { defaultMessage: 'follower options' },
});

export default function FollowerMenu({
  userRemote,
  handleSetFeed,
}: {
  userRemote: UserRemotePublic;
  handleSetFeed: (userRemote: UserRemotePublic | string) => void;
}) {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const handleMenuOpenerClick = (event: MouseEvent) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onSetFeed = (userRemote: UserRemotePublic | string) => {
    handleClose();
    handleSetFeed(userRemote);
  };

  const handleVisit = () => {
    handleClose();
    window.open(userRemote.profileUrl, userRemote.profileUrl);
  };

  const isOpen = Boolean(anchorEl);
  const menuAriaLabel = intl.formatMessage(messages.menu);
  const id = `follower-menu-${userRemote.profileUrl}`;
  const { profileUrl, following } = userRemote;

  return (
    <>
      <IconButton
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
        {!following ? <NewFeed handleSetFeed={onSetFeed} isButton={true} profileUrl={profileUrl} /> : null}
      </Menu>
    </>
  );
}
