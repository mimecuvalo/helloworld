import { createLock, setUser } from 'client/app/auth';

import Button from '@material-ui/core/Button';
import { F } from 'react-intl-wrapper';
import UserContext from 'client/app/User_Context';
import { useContext } from 'react';

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
      {user ? <F msg="logout" /> : <F msg="login" />}
    </Button>
  );
}
