import { F } from '../../../shared/i18n';
import React, { PureComponent } from 'react';

export default class Reply extends PureComponent {
  handleClick = evt => {
    // TODO(mime)
    // if item.type == 'remote-comment' then navigate to item.link
    // otherwise reply locally
  };

  render() {
    return (
      <button className="hw-button-link" onClick={this.handleClick}>
        <F msg="reply" />
      </button>
    );
  }
}
