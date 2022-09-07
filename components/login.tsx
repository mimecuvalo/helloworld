import { Button } from '@mui/material';
import { F } from 'i18n';
import { useUser } from '@auth0/nextjs-auth0';

export default function LoginLogoutButton() {
  const { user } = useUser();

  return (
    <span>
      <Button variant="contained" color="primary" href={user ? '/api/auth/logout' : '/api/auth/login'}>
        {user ? <F defaultMessage="Logout" /> : <F defaultMessage="Login" />}
      </Button>
    </span>
  );
}
