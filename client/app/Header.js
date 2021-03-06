import Button from '@material-ui/core/Button';
import { createUseStyles } from 'react-jss';
import { F } from '../../shared/i18n';
import gql from 'graphql-tag';
import LoginLogoutButton from '../components/login';
import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { useLocation } from 'react-router-dom';

const useStyles = createUseStyles({
  header: {
    display: 'block',
    position: 'fixed',
    top: '10px',
    right: '10px',
    '& a,  & a:visited': {
      color: '#fff',
    },
    '& button': {
      marginLeft: '10px',
    },
  },
});

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
  const styles = useStyles();

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
