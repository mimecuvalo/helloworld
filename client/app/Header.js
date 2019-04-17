import Button from '@material-ui/core/Button';
import { F } from '../../shared/i18n';
import LoginLogoutButton from '../components/login';
import React, { PureComponent } from 'react';
import styles from './Header.module.css';
import UserContext from '../app/User_Context';
import { withRouter } from 'react-router-dom';

@withRouter
class Header extends PureComponent {
  render() {
    return (
      <header className={styles.header}>
        <nav>
          <UserContext.Consumer>
            {({ user }) => {
              const isLoggedIn = !!user;
              const isAuthor = !!user?.model;

              return (
                <>
                  {isAuthor && this.props.location.pathname !== '/dashboard' ? (
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
}

export default Header;
