import Button from '@material-ui/core/Button';
import { F } from '../../shared/i18n';
import gql from 'graphql-tag';
import LoginLogoutButton from '../components/login';
import React from 'react';
import styles from './Header.module.css';
import { useQuery } from '@apollo/react-hooks';
import { useLocation } from 'react-router-dom';

const USER_QUERY = gql`
  {
    user @client {
      model {
        username
      }
    }
  }
`;

export default function Header() {
  const routerLocation = useLocation();
  const { data } = useQuery(USER_QUERY);
  const isLoggedIn = !!data?.user;
  const isAuthor = !!data?.user?.model;

  return (
    <header className={styles.header}>
      <nav>
        {isAuthor && routerLocation.pathname !== '/dashboard' ? (
          <Button variant="contained" color="primary" href="/dashboard">
            <F msg="dashboard" />
          </Button>
        ) : null}
        {!isLoggedIn || !isAuthor ? <LoginLogoutButton /> : null}
      </nav>
    </header>
  );
}
