import Button from '@material-ui/core/Button';
import { F } from '../../shared/i18n';
import LoginLogoutButton from '../components/login';
import React, { PureComponent } from 'react';
import styles from './Header.module.css';
import UserContext from '../app/User_Context';

export default class Header extends PureComponent {
  static contextType = UserContext;

  render() {
    const isLoggedIn = !!this.context.user;
    const isAuthor = !!this.context.user?.model;

    return (
      <header className={styles.header}>
        <nav>
          {isAuthor ? (
            <Button variant="contained" color="primary" href="/dashboard">
              <F msg="dashboard" />
            </Button>
          ) : null}
          {!isLoggedIn || !isAuthor ? <LoginLogoutButton /> : null}
        </nav>
      </header>
    );
  }
}
