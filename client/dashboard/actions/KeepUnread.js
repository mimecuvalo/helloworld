import classNames from 'classnames';
import { F } from '../../../shared/i18n';
import React, { PureComponent } from 'react';
import styles from './Actions.module.css';

export default class KeepUnread extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      enabled: false,
    };
  }
  handleClick = async evt => {
    this.props.keepUnreadCb(!this.state.enabled);
    this.setState({ enabled: !this.state.enabled });
  };

  render() {
    return (
      <button
        onClick={this.handleClick}
        className={classNames('hw-button-link', { [styles.enabled]: this.state.enabled })}
      >
        <F msg="keep unread" />
      </button>
    );
  }
}
