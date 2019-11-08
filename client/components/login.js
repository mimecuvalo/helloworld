import Button from '@material-ui/core/Button';
import { createLock, setUser } from '../app/auth';
import { F } from '../../shared/i18n';
import React, { useContext } from 'react';
import UserContext from '../app/User_Context';

export default function LoginLogoutButton() {
  const user = useContext(UserContext).user;

  const handleClick = () => {
    if (user) {
      setUser(undefined);
    } else {
      createLock().show();
    }
  };

  return (
    <Button variant="contained" color="primary" onClick={handleClick}>
      <UserContext.Consumer>{({ user }) => (user ? <F msg="Logout" /> : <F msg="Login" />)}</UserContext.Consumer>
    </Button>
  );
}
