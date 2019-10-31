import Button from '@material-ui/core/Button';
import { F } from '../../shared/i18n';
import LoginLogoutButton from '../components/login';
import React from 'react';
import styles from './Header.module.css';
import UserContext from '../app/User_Context';
import { useLocation } from 'react-router-dom';

export default function Header() {
  const routerLocation = useLocation();

  return (
    <header className={styles.header}>
      <nav>
        <UserContext.Consumer>
          {({ user }) => {
            const isLoggedIn = !!user;
            const isAuthor = !!user?.model;

            return (
              <>
                {isAuthor && routerLocation.pathname !== '/dashboard' ? (
                  <Button variant="contained" color="primary" href="/dashboard">
                    <F msg="dashboard" />
                  </Button>
                ) : null}
                {!isLoggedIn || !isAuthor ? <LoginLogoutButton /> : null}
              </>
            );
          }}
        </UserContext.Consumer>
      </nav>
    </header>
  );
}
