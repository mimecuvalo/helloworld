import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { defineMessages, F, injectIntl } from '../../shared/i18n';
import FollowingFeedsQuery from './FollowingFeedsQuery';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import React, { Component, PureComponent } from 'react';
import styles from './RemoteUsers.module.css';

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
          <MarkAllAsReadItem key="read" handleClose={this.handleClose} userRemote={this.props.userRemote} />
        </Menu>
      </>
    );
  }
}

@graphql(gql`
  mutation markAllContentInFeedAsRead($from_user: String!) {
    markAllContentInFeedAsRead(from_user: $from_user)
  }
`)
class MarkAllAsReadItem extends PureComponent {
  handleClick = async () => {
    this.props.handleClose();

    await this.props.mutate({
      variables: { from_user: this.props.userRemote.profile_url },
      refetchQueries: [
        {
          query: gql`
            {
              fetchUserTotalCounts {
                totalCount
              }
            }
          `,
        },
        { query: FollowingFeedsQuery },
      ],
    });
  };

  render() {
    return (
      <MenuItem onClick={this.handleClick}>
        <F msg="mark all as read" />
      </MenuItem>
    );
  }
}

export default injectIntl(FollowingMenu);
