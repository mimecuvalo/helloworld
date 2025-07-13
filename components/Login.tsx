import { Button } from '@mui/material';
import { F } from 'i18n';
import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0';

export default function LoginLogoutButton() {
  const router = useRouter();
  const { user } = useUser();

  if (router.asPath === '/dashboard') {
    return null;
  }

  return (
    <Button variant="contained" href={user ? '/dashboard' : '/api/auth/login'}>
      {user ? <F defaultMessage="dashboard" /> : <F defaultMessage="Login" />}
    </Button>
  );
}
