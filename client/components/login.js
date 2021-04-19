import { createLock, setUser } from 'client/app/auth';

import Button from '@material-ui/core/Button';
import { F } from 'shared/util/i18n';
import UserContext from 'client/app/User_Context';
import { useContext } from 'react';

export default function LoginLogoutButton() {
  const user = useContext(UserContext).user;

  const handleClick = async () => {
    if (user) {
      setUser(undefined);
    } else {
      (await createLock()).show();
    }
  };

  return (
    <Button variant="contained" color="primary" onClick={handleClick}>
      {user ? <F defaultMessage="logout" /> : <F defaultMessage="login" />}
    </Button>
  );
}
