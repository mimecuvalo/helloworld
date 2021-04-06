import Button from '@material-ui/core/Button';
import { createLock, setUser } from 'client/app/auth';
import { F } from 'react-intl-wrapper';
import { useContext } from 'react';
import UserContext from 'client/app/User_Context';

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
      <UserContext.Consumer>{({ user }) => (user ? <F msg="logout" /> : <F msg="login" />)}</UserContext.Consumer>
    </Button>
  );
}
