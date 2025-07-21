import { Button } from '@mui/material';
import { F } from 'i18n';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';

export default function LoginLogoutButton() {
  const router = useRouter();
  const { data: session } = useSession();

  if (router.asPath === '/dashboard') {
    return null;
  }

  const handleClick = () => signIn();

  return (
    <Button variant="contained" href={session ? '/dashboard' : undefined} onClick={!session ? handleClick : undefined}>
      {session ? <F defaultMessage="dashboard" /> : <F defaultMessage="Login" />}
    </Button>
  );
}
