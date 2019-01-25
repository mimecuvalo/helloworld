import LoginLogoutButton from '../components/login';
import React, { PureComponent } from 'react';
import styles from './Header.module.css';

export default class Header extends PureComponent {
  render() {
    return (
      <header className="App-header">
        <nav />

        <LoginLogoutButton className={styles.login} />
      </header>
    );
  }
}
