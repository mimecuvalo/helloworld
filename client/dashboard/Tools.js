import { F } from '../../shared/i18n';
import { profileUrl } from '../../shared/util/url_factory';
import React, { PureComponent } from 'react';
import UserContext from '../app/User_Context';

class Tools extends PureComponent {
  static contextType = UserContext;

  render() {
    const username = this.context.user.model.username;

    return (
      <ul className={this.props.className}>
        <li>
          <a href={profileUrl(username)} target="_blank" rel="noopener noreferrer">
            <F msg="view site" />
          </a>
        </li>
      </ul>
    );
  }
}

export default Tools;
