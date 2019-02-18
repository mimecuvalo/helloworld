import classNames from 'classnames';
import { F } from '../../../shared/i18n';
import React, { Component } from 'react';
import styles from './Actions.module.css';

class KeepUnread extends Component {
  constructor(props) {
    super(props);

    this.state = {
      enabled: false,
    };
  }
  handleClick = async evt => {
    evt.preventDefault();

    this.props.keepUnreadCb(!this.state.enabled);
    this.setState({ enabled: !this.state.enabled });
  };

  render() {
    return (
      <a
        href="#keep-unread"
        onClick={this.handleClick}
        className={classNames({ [styles.enabled]: this.state.enabled })}
      >
        <F msg="keep unread" />
      </a>
    );
  }
}

export default KeepUnread;
