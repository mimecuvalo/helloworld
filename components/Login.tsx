import { F } from 'i18n';
import { useLocation } from '@tanstack/react-router';
import { signIn, useSession } from 'lib/auth-client';

export default function LoginLogoutButton() {
  const { session } = useSession();
  const { pathname } = useLocation();

  if (pathname === '/dashboard') {
    return null;
  }

  if (session) {
    return (
      <a className="btn" href="/dashboard">
        <F defaultMessage="dashboard" />
      </a>
    );
  }

  return (
    <button type="button" className="btn" onClick={() => signIn()}>
      <F defaultMessage="Login" />
    </button>
  );
}
