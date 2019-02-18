import { F } from '../../../shared/i18n';
import MenuItem from '@material-ui/core/MenuItem';
import React, { PureComponent } from 'react';

class ViewAlreadyRead extends PureComponent {
  handleClick = async () => {
    this.props.handleClose();

    this.props.handleSetFeed(this.props.userRemote, undefined /* query */, true /* all items */);
  };

  render() {
    return (
      <MenuItem onClick={this.handleClick}>
        <F msg="view all items" />
      </MenuItem>
    );
  }
}

export default ViewAlreadyRead;
