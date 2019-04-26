import { F } from '../../../shared/i18n';
import React, { PureComponent } from 'react';

export default class Reply extends PureComponent {
  handleClick = evt => {
    evt.preventDefault();

    // TODO(mime)
    // if item.type == 'remote-comment' then navigate to item.link
    // otherwise reply locally
  };

  render() {
    return (
      <a href="#reply" onClick={this.handleClick}>
        <F msg="reply" />
      </a>
    );
  }
}
