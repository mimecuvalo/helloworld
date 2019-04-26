import classNames from 'classnames';
import { F } from '../../../shared/i18n';
import React, { PureComponent } from 'react';
import styles from './Actions.module.css';

export default class Reblog extends PureComponent {
  handleClick = evt => {
    evt.preventDefault();

    const type = this.props.contentRemote.type;
    if (type === 'remote-comment') {
      return;
    }

    // TODO(mime): in future would be great to send html.
    this.props.getEditor().reblog(this.props.contentRemote.link);
  };

  render() {
    const type = this.props.contentRemote.type;

    return (
      <a
        href="#reblog"
        onClick={this.handleClick}
        className={classNames({ [styles.disabled]: type === 'remote-comment' })}
      >
        <F msg="reblog" />
      </a>
    );
  }
}
