import Button from '@material-ui/core/Button';
import { F } from 'react-intl-wrapper';
import LoginLogoutButton from 'client/components/login';
import { createUseStyles } from 'react-jss';
import gql from 'graphql-tag';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@apollo/client';

const useStyles = createUseStyles({
  header: {
    display: 'block',
    position: 'fixed',
    top: '10px',
    right: '10px',
    '& a,  & a:visited': {
      color: '#060',
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
